import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const TokenPairSchema = z
  .object({
    accessToken: z.string().min(20).openapi({
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token-placeholder",
      description: "JWT access token to supply in the Authorization header.",
    }),
    refreshToken: z.string().min(20).openapi({
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-placeholder",
      description: "Rotating refresh token used to mint new access tokens.",
    }),
  })
  .openapi("TokenPair", {
    description: "Tokens returned after a successful login or refresh.",
  });

export const RegisterResponseSchema = z
  .object({
    emailVerificationRequired: z.boolean().openapi({
      example: false,
      description: "Indicates whether the user must verify their email before tokens are issued.",
    }),
    accessToken: TokenPairSchema.shape.accessToken.optional(),
    refreshToken: TokenPairSchema.shape.refreshToken.optional(),
  })
  .openapi("RegisterResponse", {
    description:
      "Response returned after registration. Tokens are omitted when email verification is required.",
    example: {
      emailVerificationRequired: false,
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.access-token-placeholder",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token-placeholder",
    },
  });

export const RequestAcceptedSchema = z
  .object({
    status: z.literal("ok"),
  })
  .openapi("AcceptedResponse", {
    description: "Acknowledgement response for asynchronous background actions.",
    example: { status: "ok" },
  });

export const RoleSchema = z.enum(["USER", "ADMIN"]).openapi("Role", {
  example: "ADMIN",
  description: "Application role associated with the authenticated user.",
});

export const SessionSummarySchema = z
  .object({
    id: z.uuid().openapi({ example: "746b96ac-983d-4b65-96a2-1e727caa0027" }),
    createdAt: z.iso
      .datetime()
      .openapi({ example: "2025-01-15T12:34:56.000Z", description: "Session creation timestamp." }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: "2025-01-16T08:12:04.000Z", description: "Last refresh timestamp." }),
    valid: z.boolean().openapi({ example: true }),
    current: z
      .boolean()
      .openapi({ example: false, description: "True when this session matches the caller token." }),
  })
  .openapi("SessionSummary", {
    description: "Minimal session metadata returned from the sessions endpoint.",
  });

export const SessionsResponseSchema = z
  .object({
    sessions: z.array(SessionSummarySchema),
    count: z.number().int().nonnegative().openapi({ example: 2 }),
  })
  .openapi("SessionsResponse", {
    description: "Paginated session listing (currently single-page).",
    example: {
      count: 1,
      sessions: [
        {
          id: "746b96ac-983d-4b65-96a2-1e727caa0027",
          createdAt: "2025-01-15T12:34:56.000Z",
          updatedAt: "2025-01-16T08:12:04.000Z",
          valid: true,
          current: true,
        },
      ],
    },
  });

export const UserSummarySchema = z
  .object({
    id: z.uuid().openapi({ example: "0c853481-6d5f-4205-8b51-7c0dcbf1bba1" }),
    email: z.email().openapi({ example: "user@example.com" }),
    role: RoleSchema,
  })
  .openapi("UserSummary", {
    description: "Minimal user profile payload returned when accessing protected resources.",
  });

export const ProtectedUserResponseSchema = z
  .object({
    user: UserSummarySchema,
    owner: z.boolean().openapi({
      example: true,
      description: "True when the requester is accessing their own user.",
    }),
  })
  .openapi("ProtectedUserResponse", {
    description: "Response returned when reading a protected user resource.",
  });

export function registerAuthSchemas(registry: OpenAPIRegistry): void {
  registry.register("TokenPair", TokenPairSchema);
  registry.register("RegisterResponse", RegisterResponseSchema);
  registry.register("AcceptedResponse", RequestAcceptedSchema);
  registry.register("Role", RoleSchema);
  registry.register("SessionSummary", SessionSummarySchema);
  registry.register("SessionsResponse", SessionsResponseSchema);
  registry.register("UserSummary", UserSummarySchema);
  registry.register("ProtectedUserResponse", ProtectedUserResponseSchema);
}
