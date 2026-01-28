import { unauthorizedResponse, validationErrorResponse } from "../components/errors.js";
import {
  QuickBooksActiveConnectionResponseSchema,
  QuickBooksCallbackQuerySchema,
  QuickBooksCallbackResponseSchema,
  QuickBooksConnectResponseSchema,
  QuickBooksWebhookResponseSchema,
} from "../components/integrations.schemas.js";
import { Tags } from "../tags.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerIntegrationsPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "post",
    path: "/api/integrations/quickbooks/connect",
    summary: "Start QuickBooks OAuth",
    description: "Create a QuickBooks OAuth state and return the authorization URL.",
    tags: [Tags.Integrations],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Authorization URL created.",
        content: { "application/json": { schema: QuickBooksConnectResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/integrations/quickbooks/connection",
    summary: "Get active QuickBooks connection",
    description: "Fetch the active QuickBooks connection for the current org.",
    tags: [Tags.Integrations],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Active connection (or null if none).",
        content: { "application/json": { schema: QuickBooksActiveConnectionResponseSchema } },
      },
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/integrations/quickbooks/callback",
    summary: "QuickBooks OAuth callback",
    description: "Handle QuickBooks OAuth redirect and store tokens.",
    tags: [Tags.Integrations],
    request: { query: QuickBooksCallbackQuerySchema },
    responses: {
      200: {
        description: "Connection established.",
        content: { "application/json": { schema: QuickBooksCallbackResponseSchema } },
      },
      400: validationErrorResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/webhooks/quickbooks",
    summary: "QuickBooks webhook",
    description: "Verify QuickBooks webhook signature and enqueue sync job.",
    tags: [Tags.Integrations],
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: { type: "object" },
          },
        },
      },
    },
    responses: {
      202: {
        description: "Webhook accepted.",
        content: { "application/json": { schema: QuickBooksWebhookResponseSchema } },
      },
      400: validationErrorResponse,
    },
  });
}
