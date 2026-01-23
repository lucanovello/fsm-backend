import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";

const OLD_ENV = { ...process.env };
const STRONG_ACCESS_SECRET = "test_jwt_access_secret_32_chars_min";
const STRONG_REFRESH_SECRET = "test_jwt_refresh_secret_32_chars_min";

beforeAll(() => {
  process.env.JWT_ACCESS_SECRET = STRONG_ACCESS_SECRET;
  process.env.JWT_REFRESH_SECRET = STRONG_REFRESH_SECRET;
  process.env.JWT_ACCESS_EXPIRY = "1h";
  process.env.JWT_REFRESH_EXPIRY = "1s";
});

afterAll(() => {
  process.env = OLD_ENV;
  vi.resetModules();
  vi.useRealTimers();
});

describe("jwt extra branches", () => {
  test("verifyAccess throws AppError on invalid token", async () => {
    vi.resetModules();
    const jwtLib = await import("../src/shared/jwt.js");
    expect(() => jwtLib.verifyAccess("not-a-jwt")).toThrow(/Invalid access token/);
  });

  test("decodeRefresh returns null on non-JWT input", async () => {
    vi.resetModules();
    const jwtLib = await import("../src/shared/jwt.js");
    expect(jwtLib.decodeRefresh("not-a-jwt")).toBeNull();
  });

  test("getTokenExpiration throws when token has no exp", async () => {
    vi.resetModules();
    const jwtLib = await import("../src/shared/jwt.js");
    const jsonwebtoken = (await import("jsonwebtoken")).default;

    const token = jsonwebtoken.sign({ sub: "u1" }, STRONG_REFRESH_SECRET);
    expect(() => jwtLib.getTokenExpiration(token)).toThrow(/missing exp/i);
  });

  test("verifyRefresh throws SESSION_EXPIRED for expired refresh token", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    vi.resetModules();
    const jwtLib = await import("../src/shared/jwt.js");
    const token = jwtLib.signRefresh({ sid: "s1" });

    vi.advanceTimersByTime(2000);

    expect(() => jwtLib.verifyRefresh(token)).toThrow(/Refresh token expired/);
  });
});
