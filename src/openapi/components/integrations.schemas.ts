import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const IntegrationProviderSchema = z
  .enum(["QUICKBOOKS"])
  .openapi("IntegrationProvider", { example: "QUICKBOOKS" });

export const IntegrationConnectionStatusSchema = z
  .enum(["PENDING", "ACTIVE", "INACTIVE", "ERROR"])
  .openapi("IntegrationConnectionStatus", { example: "ACTIVE" });

export const IntegrationConnectionSchema = z
  .object({
    id: z.string().openapi({ example: "conn_123" }),
    provider: IntegrationProviderSchema,
    realmId: z.string().nullable().openapi({ example: "1234567890" }),
    status: IntegrationConnectionStatusSchema,
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().openapi({ example: "2025-01-15T12:34:56.000Z" }),
    updatedAt: z.string().openapi({ example: "2025-01-16T08:12:04.000Z" }),
  })
  .openapi("IntegrationConnection");

export const QuickBooksConnectResponseSchema = z
  .object({
    url: z.string().url().openapi({
      example:
        "https://sandbox.appcenter.intuit.com/connect/oauth2?client_id=...&response_type=code",
    }),
    connectionId: z.string().openapi({ example: "conn_123" }),
    stateExpiresAt: z.string().openapi({ example: "2025-01-15T12:44:56.000Z" }),
  })
  .openapi("QuickBooksConnectResponse");

export const QuickBooksCallbackResponseSchema = z
  .object({
    status: z.literal("connected"),
    connectionId: z.string().openapi({ example: "conn_123" }),
    realmId: z.string().openapi({ example: "1234567890" }),
  })
  .openapi("QuickBooksCallbackResponse");

export const QuickBooksCallbackQuerySchema = z
  .object({
    code: z.string().openapi({ example: "authorization-code" }),
    realmId: z.string().openapi({ example: "1234567890" }),
    state: z.string().openapi({ example: "state-token" }),
  })
  .openapi("QuickBooksCallbackQuery");

export const QuickBooksWebhookResponseSchema = z
  .object({
    status: z.enum(["queued", "ignored"]).openapi({ example: "queued" }),
  })
  .openapi("QuickBooksWebhookResponse");

export const QuickBooksActiveConnectionResponseSchema = z
  .object({
    connection: IntegrationConnectionSchema.nullable(),
  })
  .openapi("QuickBooksActiveConnectionResponse");

export function registerIntegrationSchemas(registry: OpenAPIRegistry): void {
  registry.register("IntegrationProvider", IntegrationProviderSchema);
  registry.register("IntegrationConnectionStatus", IntegrationConnectionStatusSchema);
  registry.register("IntegrationConnection", IntegrationConnectionSchema);
  registry.register("QuickBooksConnectResponse", QuickBooksConnectResponseSchema);
  registry.register("QuickBooksCallbackResponse", QuickBooksCallbackResponseSchema);
  registry.register("QuickBooksCallbackQuery", QuickBooksCallbackQuerySchema);
  registry.register("QuickBooksWebhookResponse", QuickBooksWebhookResponseSchema);
  registry.register("QuickBooksActiveConnectionResponse", QuickBooksActiveConnectionResponseSchema);
}
