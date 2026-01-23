import { describe, expect, test, vi } from "vitest";

describe("security middleware branch coverage", () => {
  const makeSecurity = async (cfgOverrides: Record<string, any> = {}) => {
    vi.resetModules();

    const markHealthy = vi.fn();
    const markUnhealthy = vi.fn();

    const handlers = new Map<string, Function[]>();

    const createClientMock = vi.fn(() => {
      const client: any = {
        connect: vi.fn().mockResolvedValue(undefined),
        disconnect: vi.fn().mockResolvedValue(undefined),
        sendCommand: vi.fn().mockResolvedValue(undefined),
        on: vi.fn((event: string, cb: Function) => {
          const list = handlers.get(event) ?? [];
          list.push(cb);
          handlers.set(event, list);
        }),
        off: vi.fn((event: string, cb: Function) => {
          const list = (handlers.get(event) ?? []).filter((fn) => fn !== cb);
          handlers.set(event, list);
        }),
        removeListener: vi.fn((event: string, cb: Function) => {
          const list = (handlers.get(event) ?? []).filter((fn) => fn !== cb);
          handlers.set(event, list);
        }),
      };
      return client;
    });

    const baseCfg = {
      NODE_ENV: "development",
      corsOriginsParsed: [],
      RATE_LIMIT_WINDOW_SEC: 900,
      RATE_LIMIT_RPM: 600,
      RATE_LIMIT_RPM_AUTH: 120,
      RATE_LIMIT_RPM_AUTH_REGISTER: 1,
      RATE_LIMIT_RPM_AUTH_PASSWORD_RESET: 1,
      rateLimitStore: { type: "memory" as const },
      ...cfgOverrides,
    };

    let lastCorsDelegate: any = null;

    vi.doMock("cors", () => ({
      default: (delegate: any) => {
        lastCorsDelegate = delegate;
        return (req: any, res: any, next: any) => {
          delegate(req, (err: any, options: any) => {
            res.__cors = options;
            next(err);
          });
        };
      },
    }));

    vi.doMock("helmet", () => ({
      default: () => (_req: any, _res: any, next: any) => next(),
    }));

    vi.doMock("express-rate-limit", () => ({
      default: (opts: any) => {
        const mw: any = (_req: any, _res: any, next: any) => next();
        mw.__opts = opts;
        return mw;
      },
    }));

    vi.doMock("redis", () => ({
      createClient: createClientMock,
    }));

    vi.doMock("rate-limit-redis", () => {
      class FakeRedisStore {
        prefix: string;
        sendCommand: any;
        constructor(options: { prefix?: string; sendCommand?: any } = {}) {
          this.prefix = options.prefix ?? "rl:";
          this.sendCommand = options.sendCommand;
        }

        init() {
          return undefined;
        }

        async increment() {
          return { totalHits: 1, resetTime: new Date(Date.now() + 60_000) };
        }

        async decrement() {
          return undefined;
        }

        async resetKey() {
          return undefined;
        }
      }
      return { RedisStore: FakeRedisStore, default: FakeRedisStore };
    });

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => baseCfg,
    }));

    vi.doMock("../src/infrastructure/rate-limit/rateLimitHealth.js", () => ({
      markRateLimitRedisHealthy: markHealthy,
      markRateLimitRedisUnhealthy: markUnhealthy,
    }));

    vi.doMock("../src/http/middleware/authRateLimits.js", () => ({
      setAuthRegisterRateLimit: vi.fn(),
      setAuthRequestPasswordResetRateLimit: vi.fn(),
    }));

    const mod = await import("../src/http/middleware/security.js");

    const used: any[] = [];
    const app: any = {
      use: (...args: any[]) => {
        used.push(args);
      },
    };

    return {
      registerSecurity: mod.registerSecurity as (app: any) => Promise<() => Promise<void>>,
      app,
      used,
      lastCorsDelegate: () => lastCorsDelegate,
      handlers,
      createClientMock,
      markHealthy,
      markUnhealthy,
    };
  };

  test("CORS delegate: allows requests with no Origin header", async () => {
    const { registerSecurity, app, lastCorsDelegate } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://app.example"],
      rateLimitStore: { type: "redis", url: "redis://test" },
    });

    const teardown = await registerSecurity(app);

    const delegate = lastCorsDelegate();
    const cb = vi.fn();
    delegate({ headers: {}, get: () => undefined }, cb);

    expect(cb).toHaveBeenCalledWith(null, { origin: true, credentials: true });

    await teardown();
  });

  test("CORS delegate: allows allowlisted origins", async () => {
    const { registerSecurity, app, lastCorsDelegate } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://allowed.example"],
      rateLimitStore: { type: "redis", url: "redis://test" },
    });

    const teardown = await registerSecurity(app);

    const delegate = lastCorsDelegate();
    const cb = vi.fn();
    delegate(
      { headers: { origin: "https://allowed.example" }, get: () => "https://allowed.example" },
      cb,
    );

    expect(cb).toHaveBeenCalledWith(null, { origin: true, credentials: true });

    await teardown();
  });

  test("CORS delegate: allows unknown origins in non-prod when allowlist is empty", async () => {
    const { registerSecurity, app, lastCorsDelegate } = await makeSecurity({
      NODE_ENV: "development",
      corsOriginsParsed: [],
      rateLimitStore: { type: "memory" },
    });

    await registerSecurity(app);

    const delegate = lastCorsDelegate();
    const cb = vi.fn();
    delegate(
      { headers: { origin: "https://random.example" }, get: () => "https://random.example" },
      cb,
    );

    expect(cb).toHaveBeenCalledWith(null, { origin: true, credentials: true });
  });

  test("CORS delegate: blocks unknown origins in production and logs warning", async () => {
    const { registerSecurity, app, lastCorsDelegate } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://allowed.example"],
      rateLimitStore: { type: "redis", url: "redis://test" },
    });

    const teardown = await registerSecurity(app);

    const warn = vi.fn();
    const delegate = lastCorsDelegate();
    const cb = vi.fn();

    delegate(
      {
        headers: { origin: "https://blocked.example" },
        get: () => "https://blocked.example",
        log: { warn },
      },
      cb,
    );

    const errorArg = cb.mock.calls[0]?.[0];
    expect(errorArg).toBeInstanceOf(Error);
    expect((errorArg as any).code).toBe("CORS_ORIGIN_FORBIDDEN");
    expect(warn).toHaveBeenCalled();

    expect(cb.mock.calls[0]?.[1]).toEqual({ credentials: true });

    await teardown();
  });

  test("registerSecurity wires redis events, marks health, and removes listeners on teardown", async () => {
    const { registerSecurity, app, handlers, markHealthy, markUnhealthy, createClientMock } =
      await makeSecurity({
        NODE_ENV: "production",
        corsOriginsParsed: ["https://app.example"],
        rateLimitStore: { type: "redis", url: "redis://test" },
      });

    const teardown = await registerSecurity(app);

    expect(createClientMock).toHaveBeenCalled();
    expect(markHealthy).toHaveBeenCalled();

    const fire = (event: string, ...args: any[]) => {
      for (const fn of handlers.get(event) ?? []) {
        fn(...args);
      }
    };

    fire("end");
    expect(markUnhealthy).toHaveBeenCalledWith("Redis connection closed");

    fire("reconnecting");
    expect(markUnhealthy).toHaveBeenCalledWith("Redis reconnecting");

    fire("error", new Error("boom"));
    expect(markUnhealthy).toHaveBeenCalledWith("boom");

    fire("error", "boom2");
    expect(markUnhealthy).toHaveBeenCalledWith("boom2");

    await teardown();

    // Teardown should clear listeners and disconnect.
    const client = createClientMock.mock.results[0]!.value;
    expect(client.off).toHaveBeenCalled();
    expect(client.removeListener).toHaveBeenCalled();
    expect(client.disconnect).toHaveBeenCalled();
  });

  test("registerSecurity tolerates clients without event API", async () => {
    const { registerSecurity, app, createClientMock } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://app.example"],
      rateLimitStore: { type: "redis", url: "redis://test" },
    });

    createClientMock.mockImplementationOnce(() => ({
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      sendCommand: vi.fn().mockResolvedValue(undefined),
      // no on/off/removeListener
    }));

    const teardown = await registerSecurity(app);
    await teardown();
  });

  test("registerSecurity throws when production is misconfigured without redis store", async () => {
    const { registerSecurity, app } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://app.example"],
      rateLimitStore: { type: "memory" },
    });

    await expect(registerSecurity(app)).rejects.toThrow(
      "Misconfigured rate limit store: production requires Redis backing store",
    );
  });

  test("registerSecurity surfaces redis connection failures with reason", async () => {
    const { registerSecurity, app, createClientMock } = await makeSecurity({
      NODE_ENV: "production",
      corsOriginsParsed: ["https://app.example"],
      rateLimitStore: { type: "redis", url: "redis://test" },
    });

    createClientMock.mockImplementationOnce(() => ({
      connect: vi.fn().mockRejectedValueOnce(new Error("no connect")),
      disconnect: vi.fn().mockRejectedValueOnce(new Error("disconnect failed")),
      sendCommand: vi.fn().mockResolvedValue(undefined),
    }));

    await expect(registerSecurity(app)).rejects.toThrow(
      "Unable to connect to rate limit store at redis://test. Reason: no connect",
    );
  });
});
