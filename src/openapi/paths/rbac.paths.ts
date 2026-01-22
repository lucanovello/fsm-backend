import { ProtectedUserResponseSchema } from "../components/auth.schemas.js";
import {
  forbiddenResponse,
  unauthorizedResponse,
  userNotFoundResponse,
} from "../components/errors.js";
import { StatusOkSchema } from "../components/operational.schemas.js";
import { Tags } from "../tags.js";
import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerRbacPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/protected/admin/ping",
    summary: "Admin ping",
    description:
      "Simple RBAC-protected endpoint to validate that admin-only routes are correctly secured.",
    tags: [Tags.RBAC],
    operationId: "adminPing",
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Admin-only ping succeeded.",
        content: {
          "application/json": {
            schema: StatusOkSchema,
          },
        },
      },
      401: unauthorizedResponse,
      403: forbiddenResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/protected/users/{userId}",
    summary: "Get user profile",
    description:
      "Returns limited user details. Only the owner or an ADMIN role may access the resource.",
    tags: [Tags.RBAC],
    operationId: "getProtectedUser",
    security: [{ BearerAuth: [] }],
    request: {
      params: z
        .object({
          userId: z.string().uuid().openapi({
            example: "0c853481-6d5f-4205-8b51-7c0dcbf1bba1",
            description: "User ID.",
          }),
        })
        .openapi("GetProtectedUserParams"),
    },
    responses: {
      200: {
        description: "User resource located.",
        content: {
          "application/json": {
            schema: ProtectedUserResponseSchema,
          },
        },
      },
      401: unauthorizedResponse,
      403: forbiddenResponse,
      404: userNotFoundResponse,
    },
  });
}
