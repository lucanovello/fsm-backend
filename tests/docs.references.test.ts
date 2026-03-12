import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const requiredDocs = [
  "SECURITY.md",
  "docs/ops/kubernetes/README.md",
  "docs/ops/kubernetes/deployment.yaml",
  "docs/ops/kubernetes/service.yaml",
  "docs/ops/kubernetes/configmap.yaml",
  "docs/ops/kubernetes/secret.yaml",
  "docs/ops/kubernetes/ingress.yaml",
  "docs/ops/kubernetes/poddisruptionbudget.yaml",
  "docs/ops/kubernetes/serviceaccount.yaml",
  "docs/ops/kubernetes/networkpolicy-metrics.yaml",
];

describe("docs references", () => {
  test("runbook-referenced security and kubernetes files exist", () => {
    for (const relativePath of requiredDocs) {
      const absolutePath = resolve(process.cwd(), relativePath);
      expect(existsSync(absolutePath), `${relativePath} should exist`).toBe(true);
    }
  });
});
