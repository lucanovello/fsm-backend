import { unauthorizedResponse, validationErrorResponse } from "../components/errors.js";
import {
  CreateOrganizationRequestSchema,
  OrganizationResponseSchema,
  OrganizationsListResponseSchema,
} from "../components/org.schemas.js";
import { Tags } from "../tags.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerOrgPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/api/organizations",
    summary: "List organizations",
    description: "List organizations the current user belongs to.",
    tags: [Tags.Organizations],
    security: [{ BearerAuth: [] }],
    responses: {
      200: {
        description: "Organization list.",
        content: {
          "application/json": { schema: OrganizationsListResponseSchema },
        },
      },
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/organizations",
    summary: "Create organization",
    description: "Create a new organization and add the caller as owner.",
    tags: [Tags.Organizations],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: {
          "application/json": {
            schema: CreateOrganizationRequestSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "Organization created.",
        content: {
          "application/json": { schema: OrganizationResponseSchema },
        },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });
}
