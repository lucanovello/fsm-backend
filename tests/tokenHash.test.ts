import { describe, expect, test } from "vitest";

import { hashTokenSync, tokenEqualsHash } from "../src/shared/tokenHash.js";

describe("tokenHash", () => {
  test("hashTokenSync is deterministic sha256 hex", () => {
    const h1 = hashTokenSync("abc");
    const h2 = hashTokenSync("abc");
    const h3 = hashTokenSync("abcd");

    expect(h1).toBe(h2);
    expect(h1).not.toBe(h3);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
  });

  test("tokenEqualsHash returns false when lengths differ", () => {
    // Force the length-mismatch branch (hashed string not 64 chars)
    expect(tokenEqualsHash("abc", "deadbeef")).toBe(false);
  });

  test("tokenEqualsHash returns true for matching token+hash and false otherwise", () => {
    const token = "super-secret";
    const correctHash = hashTokenSync(token);

    expect(tokenEqualsHash(token, correctHash)).toBe(true);
    expect(tokenEqualsHash("wrong", correctHash)).toBe(false);
  });
});
