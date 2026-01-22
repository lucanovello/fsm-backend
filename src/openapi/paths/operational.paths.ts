import { ErrorResponseSchema, metricsForbiddenResponse } from "../components/errors.js";
import {
  MetricsTextSchema,
  ReadySchema,
  StatusOkSchema,
  VersionSchema,
} from "../components/operational.schemas.js";
import { Tags } from "../tags.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerOperationalPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/health",
    summary: "Liveness probe",
    description: "Returns HTTP 200 when the process is running and able to serve traffic.",
    tags: [Tags.Operational],
    operationId: "getHealth",
    responses: {
      200: {
        description: "Process is healthy.",
        content: { "application/json": { schema: StatusOkSchema } },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/ready",
    summary: "Readiness probe",
    description:
      "Indicates whether downstream dependencies (database, etc.) are reachable. Load balancers should poll this endpoint.",
    tags: [Tags.Operational],
    operationId: "getReadiness",
    responses: {
      200: {
        description: "Application is ready to receive traffic.",
        content: { "application/json": { schema: ReadySchema } },
      },
      503: {
        description: "Service not yet ready to receive traffic.",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
            examples: {
              shuttingDown: {
                summary: "Graceful shutdown in progress",
                value: { error: { message: "Shutting down", code: "SHUTTING_DOWN" } },
              },
              dependency: {
                summary: "Dependency not ready",
                value: { error: { message: "Not Ready", code: "NOT_READY" } },
              },
              redisUnavailable: {
                summary: "Redis dependency not ready",
                value: { error: { message: "Redis not ready", code: "REDIS_NOT_READY" } },
              },
            },
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/version",
    summary: "Build metadata",
    description:
      "Exposes the version, Git SHA, and build timestamp baked into the running artifact. Useful for debugging and release traceability.",
    tags: [Tags.Operational],
    operationId: "getVersion",
    responses: {
      200: {
        description: "Build metadata for the running instance.",
        content: {
          "application/json": {
            schema: VersionSchema,
          },
        },
      },
    },
  });

  registry.registerPath({
    method: "get",
    path: "/metrics",
    summary: "Prometheus metrics",
    description:
      "Prometheus exposition endpoint protected by environment-configurable guards. In production this endpoint must be secured via CIDR or secret gate.",
    tags: [Tags.Metrics],
    operationId: "getMetrics",
    security: [{ MetricsSecret: [] }],
    responses: {
      200: {
        description: "Prometheus text payload.",
        content: {
          "text/plain": {
            schema: MetricsTextSchema,
          },
        },
      },
      401: {
        description: "Missing or invalid metrics secret header.",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
            examples: {
              missing: {
                summary: "Secret header missing",
                value: {
                  error: {
                    message: "Missing or invalid metrics secret",
                    code: "METRICS_GUARD_MISSING",
                  },
                },
              },
              invalid: {
                summary: "Secret header incorrect",
                value: {
                  error: {
                    message: "Missing or invalid metrics secret",
                    code: "METRICS_GUARD_INVALID",
                  },
                },
              },
            },
          },
        },
      },
      403: metricsForbiddenResponse,
    },
  });
}
