import { afterEach, describe, expect, test, vi } from "vitest";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("sessionCleanup (unit)", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  test("cleanupExpiredSessions builds OR condition when refresh TTL parses", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 7 });

    vi.doMock("../src/infrastructure/db/prisma.js", () => ({
      prisma: { session: { deleteMany } },
    }));

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => ({ JWT_REFRESH_EXPIRY: "1800", SESSION_CLEANUP_INTERVAL_MINUTES: 60 }),
    }));

    const { cleanupExpiredSessions } = await import("../src/jobs/sessionCleanup.js");
    const reference = new Date("2026-01-01T00:00:00.000Z");
    const removed = await cleanupExpiredSessions(reference);
    expect(removed).toBe(7);

    const where = deleteMany.mock.calls[0]![0].where;
    expect(where).toMatchObject({
      OR: [{ valid: false }, { updatedAt: { lte: new Date(reference.getTime() - 1800 * 1000) } }],
    });
  });

  test("cleanupExpiredSessions falls back to only invalid sessions on bad TTL", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });

    vi.doMock("../src/infrastructure/db/prisma.js", () => ({
      prisma: { session: { deleteMany } },
    }));

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => ({ JWT_REFRESH_EXPIRY: "nonsense", SESSION_CLEANUP_INTERVAL_MINUTES: 60 }),
    }));

    const { cleanupExpiredSessions } = await import("../src/jobs/sessionCleanup.js");
    const removed = await cleanupExpiredSessions(new Date());
    expect(removed).toBe(2);
    expect(deleteMany).toHaveBeenCalledWith({ where: { valid: false } });
  });

  test("scheduleSessionCleanup runs immediately and does not overlap runs", async () => {
    const d = deferred<{ count: number }>();
    const deleteMany = vi.fn().mockReturnValueOnce(d.promise).mockResolvedValueOnce({ count: 0 });
    const logger = { info: vi.fn(), error: vi.fn() };

    let intervalCb: (() => void) | undefined;
    const unref = vi.fn();
    const clearIntervalSpy = vi.fn();
    const originalClearInterval = globalThis.clearInterval;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearInterval = clearIntervalSpy;

    vi.doMock("node:timers", () => ({
      setInterval: (cb: () => void) => {
        intervalCb = cb;
        return { unref };
      },
    }));

    vi.doMock("../src/infrastructure/db/prisma.js", () => ({
      prisma: { session: { deleteMany } },
    }));

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => ({ JWT_REFRESH_EXPIRY: "1s", SESSION_CLEANUP_INTERVAL_MINUTES: 60 }),
    }));

    const { scheduleSessionCleanup } = await import("../src/jobs/sessionCleanup.js");

    const stop = scheduleSessionCleanup({ intervalMs: 10, logger });

    // immediate run is invoked synchronously
    expect(deleteMany).toHaveBeenCalledTimes(1);

    expect(intervalCb).toBeTypeOf("function");

    // tick interval while first run is still in-flight -> should not overlap
    intervalCb!();
    expect(deleteMany).toHaveBeenCalledTimes(1);

    d.resolve({ count: 1 });
    await d.promise;
    // allow the async cleanup loop to finish and clear the running flag
    await Promise.resolve();
    await Promise.resolve();

    // next tick after completion -> should run again
    intervalCb!();
    expect(deleteMany).toHaveBeenCalledTimes(2);

    stop();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(unref).toHaveBeenCalledTimes(1);
    globalThis.clearInterval = originalClearInterval;
  });

  test("scheduleSessionCleanup logs errors when cleanup throws", async () => {
    const deleteMany = vi.fn().mockRejectedValue(new Error("db down"));
    const logger = { info: vi.fn(), error: vi.fn() };

    const unref = vi.fn();
    const clearIntervalSpy = vi.fn();
    const originalClearInterval = globalThis.clearInterval;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).clearInterval = clearIntervalSpy;

    vi.doMock("node:timers", () => ({
      setInterval: () => ({ unref }),
    }));

    vi.doMock("../src/infrastructure/db/prisma.js", () => ({
      prisma: { session: { deleteMany } },
    }));

    vi.doMock("../src/config/index.js", () => ({
      getConfig: () => ({ JWT_REFRESH_EXPIRY: "1s", SESSION_CLEANUP_INTERVAL_MINUTES: 60 }),
    }));

    const { scheduleSessionCleanup } = await import("../src/jobs/sessionCleanup.js");

    const stop = scheduleSessionCleanup({ intervalMs: 10, logger });
    // allow the rejected promise to be handled by the async cleanup loop
    await Promise.resolve();
    await Promise.resolve();

    expect(logger.error).toHaveBeenCalled();
    stop();

    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
    expect(unref).toHaveBeenCalledTimes(1);
    globalThis.clearInterval = originalClearInterval;
  });
});
