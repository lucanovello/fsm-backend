import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const StatusOkSchema = z.object({ status: z.literal("ok") }).openapi("StatusOk", {
  example: { status: "ok" },
  description: "Simple OK response used by liveness and ping endpoints.",
});

export const ReadySchema = z.object({ status: z.literal("ready") }).openapi("StatusReady", {
  example: { status: "ready" },
  description: "Readiness probe response when dependencies are healthy.",
});

export const VersionSchema = z
  .object({
    version: z.string().openapi({
      example: "1.0.0",
      description: "Semantic version assigned at build time.",
    }),
    gitSha: z.string().openapi({
      example: "8b4c1de7",
      description: "Short Git SHA recorded during the build.",
    }),
    buildTime: z
      .string()
      .openapi({ example: "2025-01-15T12:34:56.000Z", description: "ISO-8601 build timestamp." }),
  })
  .openapi("VersionResponse");

export const MetricsTextSchema = z.string().openapi("PrometheusMetrics", {
  example: `# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 1`,
  description: "Prometheus exposition format payload.",
});

export const OpenApiDocumentSchema = z
  .record(z.string(), z.unknown())
  .openapi("OpenApiDocument", {
    description: "Generated OpenAPI JSON document.",
  });

export const DocsHtmlSchema = z.string().openapi("SwaggerUiHtml", {
  description: "Swagger UI HTML page.",
});

export function registerOperationalSchemas(registry: OpenAPIRegistry): void {
  registry.register("StatusOk", StatusOkSchema);
  registry.register("StatusReady", ReadySchema);
  registry.register("VersionResponse", VersionSchema);
  registry.register("PrometheusMetrics", MetricsTextSchema);
  registry.register("OpenApiDocument", OpenApiDocumentSchema);
  registry.register("SwaggerUiHtml", DocsHtmlSchema);
}
