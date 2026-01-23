import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

type AnyHandler = (req: any, res: any, next: any) => any;

function getRouteHandler(router: any, method: string, path: string): AnyHandler {
  const layer = router.stack.find(
    (l: any) => l.route?.path === path && l.route?.methods?.[method] === true,
  );
  if (!layer) {
    throw new Error(`Route not found: ${method.toUpperCase()} ${path}`);
  }
  const last = layer.route.stack[layer.route.stack.length - 1];
  return last.handle;
}

describe("auth.routes (unit)", () => {
  let mockUser: any;

  const setup = async () => {
    vi.resetModules();

    // Mutable per-test: allows us to simulate "authenticated" vs broken auth.
    mockUser = { id: "u1", role: "USER", sessionId: null };

    vi.doMock("../src/http/middleware/validate.js", () => {
      return {
        validateRequest: () => (_req: any, _res: any, next: any) => next(),
      };
    });

    vi.doMock("../src/http/middleware/authRateLimits.js", () => {
      const pass = (_req: any, _res: any, next: any) => next();
      return {
        authRegisterRateLimit: pass,
        authRequestPasswordResetRateLimit: pass,
      };
    });

    vi.doMock("../src/http/middleware/requireAuth.js", () => {
      return {
        requireAuth: (req: any, res: any, next: any) => {
          req.user = mockUser;
          res.locals = res.locals ?? {};
          res.locals.userId = mockUser?.id;
          res.locals.sessionId = mockUser?.sessionId ?? null;
          next();
        },
      };
    });

    vi.doMock("../src/modules/auth/auth.service.js", () => {
      return {
        register: vi.fn(),
        login: vi.fn(),
        refresh: vi.fn(),
        logout: vi.fn(),
        verifyEmail: vi.fn(),
        requestPasswordReset: vi.fn(),
        resetPassword: vi.fn(),
        listSessions: vi.fn(),
        logoutAll: vi.fn(),
      };
    });

    const Auth = await import("../src/modules/auth/auth.service.js");
    const { auth } = await import("../src/http/routes/auth.routes.js");

    const app = express();
    app.use(express.json());
    app.use("/auth", auth);
    app.use((err: any, _req: any, res: any, _next: any) => {
      res
        .status(err?.statusCode ?? 500)
        .json({ error: { message: err?.message ?? "Error", code: err?.code } });
    });

    return { app, authRouter: auth as any, Auth };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("POST /auth/register omits tokens when service does not return them", async () => {
    const { app, Auth } = await setup();

    (Auth.register as any).mockResolvedValue({ emailVerificationRequired: true });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "a@example.com", password: "Passw0rd!" })
      .expect(201);

    expect(res.body).toEqual({ emailVerificationRequired: true });
    expect(res.body.accessToken).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
  });

  test("POST /auth/register includes tokens when both are strings", async () => {
    const { app, Auth } = await setup();

    (Auth.register as any).mockResolvedValue({
      emailVerificationRequired: false,
      accessToken: "access",
      refreshToken: "refresh",
    });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "b@example.com", password: "Passw0rd!" })
      .expect(201);

    expect(res.body).toEqual({
      emailVerificationRequired: false,
      accessToken: "access",
      refreshToken: "refresh",
    });
  });

  test("POST /auth/register omits tokens when only one is a string", async () => {
    const { app, Auth } = await setup();

    (Auth.register as any).mockResolvedValue({
      emailVerificationRequired: false,
      accessToken: "access",
      refreshToken: 123,
    });

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "c@example.com", password: "Passw0rd!" })
      .expect(201);

    expect(res.body).toEqual({ emailVerificationRequired: false });
  });

  test("login handler uses socket.remoteAddress when req.ip is empty", async () => {
    const { authRouter, Auth } = await setup();

    (Auth.login as any).mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const handler = getRouteHandler(authRouter, "post", "/login");

    const req = {
      body: { email: "a@example.com", password: "pw" },
      ip: "",
      socket: { remoteAddress: "203.0.113.9" },
    };

    const res: any = {
      statusCode: 0,
      payload: undefined,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        this.payload = body;
        return this;
      },
    };

    const next = vi.fn();

    await handler(req, res, next);

    expect(Auth.login).toHaveBeenCalledWith(
      { email: "a@example.com", password: "pw" },
      { ipAddress: "203.0.113.9" },
    );
    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ accessToken: "a", refreshToken: "r" });
  });

  test("login handler falls back to 'unknown' when no ip is available", async () => {
    const { authRouter, Auth } = await setup();

    (Auth.login as any).mockResolvedValue({ accessToken: "a", refreshToken: "r" });

    const handler = getRouteHandler(authRouter, "post", "/login");

    const req = {
      body: { email: "a@example.com", password: "pw" },
      ip: null,
      socket: {},
    };

    const res: any = {
      statusCode: 0,
      payload: undefined,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(body: any) {
        this.payload = body;
        return this;
      },
    };

    const next = vi.fn();

    await handler(req, res, next);

    expect(Auth.login).toHaveBeenCalledWith(
      { email: "a@example.com", password: "pw" },
      { ipAddress: "unknown" },
    );
    expect(res.statusCode).toBe(200);
  });

  test("GET /auth/sessions returns 401 when requireAuth did not attach userId", async () => {
    const { app } = await setup();
    mockUser = { role: "USER", sessionId: null };

    const res = await request(app).get("/auth/sessions").expect(401);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });

  test("GET /auth/sessions passes null when sessionId is missing", async () => {
    const { app, Auth } = await setup();
    mockUser = { id: "u1", role: "USER" };

    (Auth.listSessions as any).mockResolvedValue([
      { id: "s1", createdAt: new Date(), updatedAt: new Date(), valid: true, current: true },
    ]);

    const res = await request(app).get("/auth/sessions").expect(200);

    expect(Auth.listSessions).toHaveBeenCalledWith("u1", null);
    expect(res.body.count).toBe(1);
  });

  test("POST /auth/logout-all returns 401 when requireAuth did not attach userId", async () => {
    const { app } = await setup();
    mockUser = { role: "USER", sessionId: null };

    const res = await request(app).post("/auth/logout-all").expect(401);
    expect(res.body?.error?.code).toBe("UNAUTHORIZED");
  });
});
