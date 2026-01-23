import { beforeAll, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("../src/infrastructure/db/prisma.js", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
      },
      session: {
        findUnique: vi.fn(),
      },
    },
  };
});

vi.mock("../src/modules/auth/auth.service.js", () => {
  return {
    authenticateAccessToken: vi.fn(),
  };
});

describe("auth middlewares (unit)", () => {
  let prisma: any;
  let authenticateAccessToken: any;
  let requireAuth: typeof import("../src/http/middleware/requireAuth.js").requireAuth;
  let requireRole: typeof import("../src/http/middleware/requireRole.js").requireRole;

  beforeAll(async () => {
    ({ prisma } = await import("../src/infrastructure/db/prisma.js"));
    ({ authenticateAccessToken } = await import("../src/modules/auth/auth.service.js"));
    ({ requireAuth } = await import("../src/http/middleware/requireAuth.js"));
    ({ requireRole } = await import("../src/http/middleware/requireRole.js"));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("requireRole returns 401 when req.user missing", () => {
    const mw = requireRole("ADMIN" as any);

    const req = {} as any;
    const next = vi.fn();

    mw(req, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireRole returns 403 when role not allowed", () => {
    const mw = requireRole("ADMIN" as any);

    const req = { user: { role: "USER" } } as any;
    const next = vi.fn();

    mw(req, {} as any, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  test("requireRole allows when role matches", () => {
    const mw = requireRole("ADMIN" as any);

    const req = { user: { role: "ADMIN" } } as any;
    const next = vi.fn();

    mw(req, {} as any, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("requireAuth returns 401 when Authorization header missing", async () => {
    const req = { headers: {} } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireAuth returns 401 when Bearer token is empty", async () => {
    const req = { headers: { authorization: "Bearer   " } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireAuth returns 401 when user does not exist", async () => {
    authenticateAccessToken.mockReturnValue({ userId: "u1", sessionId: null });
    prisma.user.findUnique.mockResolvedValue(null);

    const req = { headers: { authorization: "Bearer token" } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireAuth returns 401 when session is missing", async () => {
    authenticateAccessToken.mockReturnValue({ userId: "u1", sessionId: "s1" });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.session.findUnique.mockResolvedValue(null);

    const req = { headers: { authorization: "Bearer token" } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireAuth returns 401 when session belongs to another user", async () => {
    authenticateAccessToken.mockReturnValue({ userId: "u1", sessionId: "s1" });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.session.findUnique.mockResolvedValue({ id: "s1", userId: "u2", valid: true });

    const req = { headers: { authorization: "Bearer token" } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "UNAUTHORIZED" });
  });

  test("requireAuth returns 401 when session is invalid", async () => {
    authenticateAccessToken.mockReturnValue({ userId: "u1", sessionId: "s1" });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "USER" });
    prisma.session.findUnique.mockResolvedValue({ id: "s1", userId: "u1", valid: false });

    const req = { headers: { authorization: "Bearer token" } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    const err = next.mock.calls[0]?.[0];
    expect(err).toMatchObject({ statusCode: 401, code: "SESSION_INVALID" });
  });

  test("requireAuth attaches user and locals when valid", async () => {
    authenticateAccessToken.mockReturnValue({ userId: "u1", sessionId: "s1" });
    prisma.user.findUnique.mockResolvedValue({ id: "u1", role: "ADMIN" });
    prisma.session.findUnique.mockResolvedValue({ id: "s1", userId: "u1", valid: true });

    const req = { headers: { authorization: "Bearer token" } } as any;
    const res = { locals: {} } as any;
    const next = vi.fn();

    await requireAuth(req, res, next);

    expect(req.user).toEqual({ id: "u1", role: "ADMIN", sessionId: "s1" });
    expect(res.locals).toMatchObject({ userId: "u1", sessionId: "s1" });
    expect(next).toHaveBeenCalledWith();
  });
});
