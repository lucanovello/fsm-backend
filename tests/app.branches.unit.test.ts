import request from "supertest";
import { describe, expect, test, vi } from "vitest";

type PartialConfig = Record<string, unknown>;

describe("app.ts branch coverage", () => {
  const makeApp = async (overrides: PartialConfig = {}) => {
    vi.resetModules();

    let isShuttingDownValue = false;
    let redisHealthValue: { status: "ready" | "unhealthy" } = { status: "ready" };
    const prismaQueryRaw = vi.fn().mockResolvedValue(1);

    const cfg = {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      trustProxy: "loopback",
      REQUEST_BODY_LIMIT: "100kb",
      responseCompression: { enabled: false, minBytes: 1024 },
      metricsEnabled: true,
      metricsGuard: { type: "none" },
      rateLimitStore: { type: "memory" },
      ...overrides,
    };

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => cfg,
    }));

    vi.doMock("../src/generated/meta.js", () => ({
      BUILD_VERSION: "test",
      BUILD_GIT_SHA: "deadbeef",
      BUILD_TIME: "now",
    }));

    vi.doMock("pino", () => ({
      default: () => ({
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      }),
    }));

    vi.doMock("pino-http", () => ({
      default: () => (req: any, _res: any, next: any) => {
        req.id = req.headers["x-request-id"] ?? "req-1";
        req.log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
        next();
      },
    }));

    vi.doMock("../src/http/middleware/security.js", () => ({
      registerSecurity: async () => async () => undefined,
    }));

    vi.doMock("../src/http/metrics/index.js", () => ({
      metricsMiddleware: (_req: any, _res: any, next: any) => next(),
      metricsHandler: (_req: any, res: any) => res.status(200).send("ok"),
    }));

    vi.doMock("../src/http/docs/swagger.js", () => ({
      registerDocs: () => undefined,
    }));

    vi.doMock("../src/http/routes/api.routes.js", async () => {
      const express = await import("express");
      return { apiRoutes: express.Router() };
    });

    vi.doMock("../src/http/routes/auth.routes.js", async () => {
      const express = await import("express");
      return { auth: express.Router() };
    });

    vi.doMock("../src/http/routes/protected.routes.js", async () => {
      const express = await import("express");
      return { protectedRoutes: express.Router() };
    });

    vi.doMock("../src/infrastructure/db/prisma.js", () => ({
      prisma: {
        $queryRaw: (...args: any[]) => prismaQueryRaw(...args),
      },
    }));

    vi.doMock("../src/infrastructure/rate-limit/rateLimitHealth.js", () => ({
      getRateLimitRedisHealth: () => redisHealthValue,
    }));

    vi.doMock("../src/lifecycle/state.js", () => ({
      isShuttingDown: () => isShuttingDownValue,
    }));

    const mod = await import("../src/app.js");

    return {
      app: mod.default,
      setShuttingDown: (value: boolean) => {
        isShuttingDownValue = value;
      },
      setRedisHealth: (status: "ready" | "unhealthy") => {
        redisHealthValue = { status };
      },
      prismaQueryRaw,
    };
  };

  test("/ready returns 503 when shutting down", async () => {
    const { app, setShuttingDown } = await makeApp();
    setShuttingDown(true);

    const res = await request(app).get("/ready").expect(503);
    expect(res.body?.error?.code).toBe("SHUTTING_DOWN");
  });

  test("/ready returns 503 when DB health check fails", async () => {
    const { app, prismaQueryRaw } = await makeApp();
    prismaQueryRaw.mockRejectedValueOnce(new Error("db down"));

    const res = await request(app).get("/ready").expect(503);
    expect(res.body?.error?.code).toBe("NOT_READY");
  });

  test("/ready checks redis health when redis store is required", async () => {
    const { app, setRedisHealth } = await makeApp({
      NODE_ENV: "production",
      rateLimitStore: { type: "redis" },
    });

    setRedisHealth("unhealthy");
    const blocked = await request(app).get("/ready").expect(503);
    expect(blocked.body?.error?.code).toBe("REDIS_NOT_READY");

    setRedisHealth("ready");
    await request(app).get("/ready").expect(200);
  });

  test("/metrics is not registered when NODE_ENV=production and metricsEnabled=false", async () => {
    const { app } = await makeApp({ NODE_ENV: "production", metricsEnabled: false });
    await request(app).get("/metrics").expect(404);
  });

  test("/metrics secret guard returns INVALID when header is present but wrong", async () => {
    const { app } = await makeApp({
      NODE_ENV: "production",
      metricsEnabled: true,
      metricsGuard: { type: "secret", secret: "expected" },
    });

    const res = await request(app).get("/metrics").set("x-metrics-secret", "wrong").expect(401);
    expect(res.body?.error?.code).toBe("METRICS_GUARD_INVALID");
  });

  test("/metrics none guard blocks in production", async () => {
    const { app } = await makeApp({
      NODE_ENV: "production",
      metricsEnabled: true,
      metricsGuard: { type: "none" },
    });

    const res = await request(app).get("/metrics").expect(403);
    expect(res.body?.error?.code).toBe("METRICS_GUARD_FORBIDDEN");
  });

  test("/metrics none guard allows in non-production", async () => {
    const { app } = await makeApp({
      NODE_ENV: "test",
      metricsEnabled: false,
      metricsGuard: { type: "none" },
    });

    await request(app).get("/metrics").expect(200);
  });
});
