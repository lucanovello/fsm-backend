import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  ServiceLocationCreateSchema,
  ServiceLocationIdParamsSchema,
  ServiceLocationsListQuerySchema,
  ServiceLocationUpdateSchema,
} from "./dto/serviceLocations.dto.js";
import {
  createServiceLocationHandler,
  deleteServiceLocationHandler,
  getServiceLocationHandler,
  listServiceLocationsHandler,
  updateServiceLocationHandler,
} from "./serviceLocations.controller.js";

export const serviceLocationsRoutes = Router();

serviceLocationsRoutes.get(
  "/",
  validateRequest({ query: ServiceLocationsListQuerySchema }),
  listServiceLocationsHandler,
);

serviceLocationsRoutes.post(
  "/",
  validateRequest({ body: ServiceLocationCreateSchema }),
  createServiceLocationHandler,
);

serviceLocationsRoutes.get(
  "/:id",
  validateRequest({ params: ServiceLocationIdParamsSchema }),
  getServiceLocationHandler,
);

serviceLocationsRoutes.patch(
  "/:id",
  validateRequest({ params: ServiceLocationIdParamsSchema, body: ServiceLocationUpdateSchema }),
  updateServiceLocationHandler,
);

serviceLocationsRoutes.delete(
  "/:id",
  validateRequest({ params: ServiceLocationIdParamsSchema }),
  deleteServiceLocationHandler,
);
