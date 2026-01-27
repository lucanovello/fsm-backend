import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  WorkTemplateCreateSchema,
  WorkTemplateIdParamsSchema,
  WorkTemplateUpdateSchema,
  WorkTemplatesListQuerySchema,
} from "./dto/workTemplates.dto.js";
import {
  createWorkTemplateHandler,
  deleteWorkTemplateHandler,
  getWorkTemplateHandler,
  listWorkTemplatesHandler,
  updateWorkTemplateHandler,
} from "./workTemplates.controller.js";

export const workTemplatesRoutes = Router();

workTemplatesRoutes.get(
  "/",
  validateRequest({ query: WorkTemplatesListQuerySchema }),
  listWorkTemplatesHandler,
);

workTemplatesRoutes.post(
  "/",
  validateRequest({ body: WorkTemplateCreateSchema }),
  createWorkTemplateHandler,
);

workTemplatesRoutes.get(
  "/:id",
  validateRequest({ params: WorkTemplateIdParamsSchema }),
  getWorkTemplateHandler,
);

workTemplatesRoutes.patch(
  "/:id",
  validateRequest({ params: WorkTemplateIdParamsSchema, body: WorkTemplateUpdateSchema }),
  updateWorkTemplateHandler,
);

workTemplatesRoutes.delete(
  "/:id",
  validateRequest({ params: WorkTemplateIdParamsSchema }),
  deleteWorkTemplateHandler,
);
