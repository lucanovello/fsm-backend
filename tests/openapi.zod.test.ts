import { describe, expect, test } from "vitest";

describe("openapi zod re-export", () => {
  test("re-exports z from shared zod", async () => {
    const openapi = await import("../src/openapi/zod.js");
    const shared = await import("../src/shared/zod.js");

    expect(openapi.z).toBe(shared.z);
  });
});
