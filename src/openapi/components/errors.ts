import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const ErrorSchema = z
  .object({
    message: z.string().openapi({ example: "Unauthorized" }),
    code: z.string().optional().openapi({
      example: "UNAUTHORIZED",
      description: "Machine-readable error code when present.",
    }),
    details: z
      .unknown()
      .optional()
      .openapi({ description: "Optional structured details (validation issues, etc.)." }),
  })
  .openapi("Error", {
    description: "Standard error payload included in the `error` envelope.",
  });

export const ErrorResponseSchema = z.object({ error: ErrorSchema }).openapi("ErrorResponse", {
  description: "Error response envelope shared by all endpoints.",
});

export function registerErrorSchemas(registry: OpenAPIRegistry): void {
  registry.register("Error", ErrorSchema);
  registry.register("ErrorResponse", ErrorResponseSchema);
}

export type ErrorExample = { message: string; code?: string; details?: unknown };

export const makeErrorResponse = (description: string, example: ErrorExample) => ({
  description,
  content: {
    "application/json": {
      schema: ErrorResponseSchema,
      example: { error: example },
    },
  },
});

export const errorResponse = makeErrorResponse;

export const validationErrorResponse = errorResponse("Invalid request payload", {
  message: "Invalid request payload",
  code: "VALIDATION",
  details: [
    {
      path: ["field"],
      code: "invalid_type",
      message: "Expected string, received null",
    },
  ],
});

export const unauthorizedResponse = errorResponse("Missing or invalid bearer token", {
  message: "Unauthorized",
  code: "UNAUTHORIZED",
});

export const forbiddenResponse = errorResponse("Authenticated but lacking required role", {
  message: "Forbidden",
  code: "FORBIDDEN",
});

export const emailTakenResponse = errorResponse("Email already registered", {
  message: "Email already registered",
  code: "EMAIL_TAKEN",
});

export const invalidCredentialsResponse = errorResponse("Invalid credentials", {
  message: "Invalid credentials",
  code: "INVALID_CREDENTIALS",
});

export const refreshRequiredResponse = errorResponse("Refresh token missing", {
  message: "Refresh token required",
  code: "REFRESH_REQUIRED",
});

export const metricsForbiddenResponse = errorResponse("Caller not allowed to access metrics", {
  message: "Metrics access forbidden",
  code: "METRICS_GUARD_FORBIDDEN",
});

export const userNotFoundResponse = errorResponse("Requested user does not exist", {
  message: "User not found",
  code: "USER_NOT_FOUND",
});
