import { expect, test } from "vitest";

import {
  getRateLimitRedisHealth,
  markRateLimitRedisHealthy,
  markRateLimitRedisUnhealthy,
} from "../src/infrastructure/rate-limit/rateLimitHealth.js";

test("rateLimitHealth transitions between unknown/ready/unhealthy", () => {
  expect(getRateLimitRedisHealth()).toEqual({ status: "unknown" });

  markRateLimitRedisHealthy();
  expect(getRateLimitRedisHealth()).toEqual({ status: "ready" });

  markRateLimitRedisUnhealthy("connection dropped");
  expect(getRateLimitRedisHealth()).toEqual({ status: "unhealthy", reason: "connection dropped" });
});

test("markRateLimitRedisUnhealthy without reason omits reason", () => {
  markRateLimitRedisUnhealthy();
  expect(getRateLimitRedisHealth()).toEqual({ status: "unhealthy" });
});
