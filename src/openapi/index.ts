/**
 * OpenAPI 3.1 document generated from Zod DTOs.
 * Aligns HTTP docs with the runtime validators to prevent drift.
 */

import "./zod.js";

import { OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";

import { registerAuthSchemas } from "./components/auth.schemas.js";
import { registerErrorSchemas } from "./components/errors.js";
import { registerFsmSchemas } from "./components/fsm.schemas.js";
import { registerOperationalSchemas } from "./components/operational.schemas.js";
import { registerSecuritySchemes } from "./components/securitySchemes.js";
import { registerAuthPaths } from "./paths/auth.paths.js";
import { registerFsmPaths } from "./paths/fsm.paths.js";
import { registerOperationalPaths } from "./paths/operational.paths.js";
import { registerRbacPaths } from "./paths/rbac.paths.js";
import { applyTagMetadata } from "./tags.js";

const registry = new OpenAPIRegistry();

registerErrorSchemas(registry);
registerSecuritySchemes(registry);
registerOperationalSchemas(registry);
registerAuthSchemas(registry);
registerFsmSchemas(registry);

registerOperationalPaths(registry);
registerAuthPaths(registry);
registerRbacPaths(registry);
registerFsmPaths(registry);

const generator = new OpenApiGeneratorV31(registry.definitions);

const openapi = generator.generateDocument({
  openapi: "3.1.0",
  info: {
    title: "FSM Backend API",
    version: "1.0.0",
    description: [
      "OpenAPI document generated from shared Zod schemas to guarantee parity between validation and documentation.",
      "",
      "Base paths: `/api` (business resources), `/auth` (authentication), `/protected` (role-protected resources).",
    ].join("\n"),
    contact: {
      name: "FSM Backend",
      url: "https://github.com/lucanovello/fsm-backend",
    },
  },
  servers: [{ url: "/", description: "Default base path." }],
});

applyTagMetadata(openapi as unknown as Record<string, unknown>);

export default openapi;
