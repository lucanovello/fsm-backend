import { describe, expect, test, vi } from "vitest";

describe("lifecycle state", () => {
  test("beginShutdown flips isShuttingDown", async () => {
    vi.resetModules();
    const state = await import("../src/lifecycle/state.js");

    expect(state.isShuttingDown()).toBe(false);
    state.beginShutdown();
    expect(state.isShuttingDown()).toBe(true);
  });
});
