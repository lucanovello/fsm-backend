import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

function createMockRes() {
  const json = vi.fn();
  const res = {
    headersSent: false,
    status: vi.fn().mockReturnThis(),
    json,
  };
  return { res, json };
}

describe("errorHandler", () => {
  test("delegates to next(err) if headers already sent", async () => {
    vi.resetModules();
    const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

    const { res } = createMockRes();
    res.headersSent = true;
    const next = vi.fn();
    const err = new Error("late");

    errorHandler(err, {} as any, res as any, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  test("returns 400 + issues for ZodError in non-prod", async () => {
    const oldEnv = { ...process.env };
    try {
      process.env.NODE_ENV = "test";
      vi.resetModules();
      const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

      const schema = z.object({ email: z.string().email() });
      const result = schema.safeParse({ email: "nope" });
      expect(result.success).toBe(false);

      const { res, json } = createMockRes();
      errorHandler((result as any).error, {} as any, res as any, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      const body = json.mock.calls[0]![0];
      expect(body.error.message).toBe("Invalid request payload");
      expect(body.error.code).toBe("VALIDATION");
      expect(body.error.details?.length).toBeGreaterThan(0);
    } finally {
      process.env = oldEnv;
      vi.resetModules();
    }
  });

  test("omits Zod issues in production", async () => {
    const oldEnv = { ...process.env };
    try {
      process.env.NODE_ENV = "production";
      vi.resetModules();
      const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

      const schema = z.object({ n: z.number().int() });
      const result = schema.safeParse({ n: "nope" });
      expect(result.success).toBe(false);

      const { res, json } = createMockRes();
      errorHandler((result as any).error, {} as any, res as any, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith({
        error: { message: "Invalid request payload", code: "VALIDATION" },
      });
    } finally {
      process.env = oldEnv;
      vi.resetModules();
    }
  });

  test("returns 400 Invalid JSON for entity.parse.failed", async () => {
    vi.resetModules();
    const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

    const err = new SyntaxError("Unexpected token }");
    (err as any).type = "entity.parse.failed";
    (err as any).status = 400;

    const { res, json } = createMockRes();
    errorHandler(err, {} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: { message: "Invalid JSON" } });
  });

  test("supports generic HTTP-ish errors with status", async () => {
    vi.resetModules();
    const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

    const err = { status: 418, message: "I am a teapot" };
    const { res, json } = createMockRes();

    errorHandler(err as any, {} as any, res as any, vi.fn());
    expect(res.status).toHaveBeenCalledWith(418);
    expect(json).toHaveBeenCalledWith({ error: { message: "I am a teapot" } });
  });

  test("falls back to 500 Internal Server Error", async () => {
    vi.resetModules();
    const { errorHandler } = await import("../src/http/middleware/errorHandler.js");

    const { res, json } = createMockRes();
    errorHandler(new Error("unknown"), {} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: { message: "Internal Server Error" } });
  });
});
