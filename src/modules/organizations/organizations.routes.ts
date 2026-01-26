import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { CreateOrganizationSchema } from "./dto/organizations.dto.js";
import { createOrganizationHandler, listOrganizationsHandler } from "./organizations.controller.js";

export const organizationsRoutes = Router();

organizationsRoutes.get("/", listOrganizationsHandler);

organizationsRoutes.post(
  "/",
  validateRequest({ body: CreateOrganizationSchema }),
  createOrganizationHandler,
);
