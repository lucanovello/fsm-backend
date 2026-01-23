import { describe, expect, test, vi } from "vitest";

import { notFound } from "../src/http/middleware/notFound.js";

describe("notFound", () => {
  test("returns JSON 404 envelope", () => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    notFound({} as any, res as any, vi.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: { message: "Not Found" } });
  });
});
