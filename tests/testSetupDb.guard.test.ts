import { describe, expect, test } from "vitest";

import { assertSafeTestDatabaseUrl } from "../scripts/test/setup-test-db.mjs";

describe("test setup DB guard", () => {
  test("accepts localhost test database URL", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/fsm_backend_test?schema=public",
      ),
    ).not.toThrow();
  });

  test("rejects non-local host", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://postgres:postgres@prod-db.internal:5432/fsm_backend_test?schema=public",
      ),
    ).toThrowError(/host must be localhost/i);
  });

  test("rejects database name without _test suffix", () => {
    expect(() =>
      assertSafeTestDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/fsm_backend?schema=public",
      ),
    ).toThrowError(/must end with _test/i);
  });
});
