import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerSecuritySchemes(registry: OpenAPIRegistry): void {
  registry.registerComponent("securitySchemes", "BearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "Send the access token obtained during login or refresh as `Authorization: Bearer <token>`.",
  });

  registry.registerComponent("securitySchemes", "MetricsSecret", {
    type: "apiKey",
    in: "header",
    name: "x-metrics-secret",
    description:
      "When the metrics guard is configured for shared-secret mode, supply the configured secret.",
  });
}
