import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { TechniciansListQuerySchema } from "./dto/technicians.dto.js";
import { listTechniciansHandler } from "./technicians.controller.js";

export const techniciansRoutes = Router();

techniciansRoutes.get(
  "/",
  validateRequest({ query: TechniciansListQuerySchema }),
  listTechniciansHandler,
);
