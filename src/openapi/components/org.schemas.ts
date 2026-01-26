import { CreateOrganizationSchema } from "../../modules/organizations/dto/organizations.dto.js";
import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const OrgMemberRoleSchema = z
  .enum(["OWNER", "MEMBER"])
  .openapi("OrgMemberRole", { example: "OWNER" });

export const OrganizationSummarySchema = z
  .object({
    id: z.string().openapi({ example: "org_123" }),
    name: z.string().openapi({ example: "Acme Services" }),
    slug: z.string().openapi({ example: "acme-services" }),
    role: OrgMemberRoleSchema,
  })
  .openapi("OrganizationSummary");

export const OrganizationsListResponseSchema = z
  .object({
    items: z.array(OrganizationSummarySchema),
    count: z.number().int().nonnegative().openapi({ example: 1 }),
  })
  .openapi("OrganizationsListResponse", {
    example: {
      items: [
        {
          id: "org_123",
          name: "Acme Services",
          slug: "acme-services",
          role: "OWNER",
        },
      ],
      count: 1,
    },
  });

export const CreateOrganizationRequestSchema = CreateOrganizationSchema.openapi(
  "CreateOrganizationRequest",
  {
    example: { name: "Acme Services" },
  },
);

export const OrganizationResponseSchema = z
  .object({
    organization: OrganizationSummarySchema,
  })
  .openapi("OrganizationResponse", {
    example: {
      organization: {
        id: "org_123",
        name: "Acme Services",
        slug: "acme-services",
        role: "OWNER",
      },
    },
  });

export function registerOrgSchemas(registry: OpenAPIRegistry): void {
  registry.register("OrgMemberRole", OrgMemberRoleSchema);
  registry.register("OrganizationSummary", OrganizationSummarySchema);
  registry.register("OrganizationsListResponse", OrganizationsListResponseSchema);
  registry.register("CreateOrganizationRequest", CreateOrganizationRequestSchema);
  registry.register("OrganizationResponse", OrganizationResponseSchema);
}
