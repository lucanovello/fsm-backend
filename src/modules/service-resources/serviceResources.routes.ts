import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  ServiceResourceCreateSchema,
  ServiceResourceIdParamsSchema,
  ServiceResourceUpdateSchema,
  ServiceResourcesListQuerySchema,
} from "./dto/serviceResources.dto.js";
import {
  createServiceResourceHandler,
  deleteServiceResourceHandler,
  getServiceResourceHandler,
  listServiceResourcesHandler,
  updateServiceResourceHandler,
} from "./serviceResources.controller.js";

export const serviceResourcesRoutes = Router();

serviceResourcesRoutes.get(
  "/",
  validateRequest({ query: ServiceResourcesListQuerySchema }),
  listServiceResourcesHandler,
);

serviceResourcesRoutes.post(
  "/",
  validateRequest({ body: ServiceResourceCreateSchema }),
  createServiceResourceHandler,
);

serviceResourcesRoutes.get(
  "/:id",
  validateRequest({ params: ServiceResourceIdParamsSchema }),
  getServiceResourceHandler,
);

serviceResourcesRoutes.patch(
  "/:id",
  validateRequest({ params: ServiceResourceIdParamsSchema, body: ServiceResourceUpdateSchema }),
  updateServiceResourceHandler,
);

serviceResourcesRoutes.delete(
  "/:id",
  validateRequest({ params: ServiceResourceIdParamsSchema }),
  deleteServiceResourceHandler,
);
