import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import openapi from "../src/openapi/index.js";

const operationalEndpoints = ["/health", "/ready", "/version", "/metrics", "/openapi.json", "/docs"];

describe("operational contract parity", () => {
  test("generated OpenAPI contains documented operational endpoints", () => {
    const paths = Object.keys((openapi as { paths?: Record<string, unknown> }).paths ?? {});
    for (const endpoint of operationalEndpoints) {
      expect(paths).toContain(endpoint);
    }
  });

  test("human API contract includes the same operational endpoints", () => {
    const contractDoc = readFileSync(
      resolve(process.cwd(), "docs/api-contracts-v0.md"),
      "utf8",
    );
    for (const endpoint of operationalEndpoints) {
      expect(contractDoc).toContain(`GET ${endpoint}`);
    }
  });
});
