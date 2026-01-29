import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  GeoDeviceCreateSchema,
  GeoPingBatchIngestSchema,
  GeoPingsQuerySchema,
  GeoResourceIdParamsSchema,
} from "./dto/geoTracking.dto.js";
import {
  createGeoDeviceHandler,
  getLatestGeoPingHandler,
  ingestGeoPingsHandler,
  listGeoPingsHandler,
} from "./geoTracking.controller.js";

export const geoTrackingRoutes = Router();

geoTrackingRoutes.post(
  "/devices",
  validateRequest({ body: GeoDeviceCreateSchema }),
  createGeoDeviceHandler,
);

geoTrackingRoutes.post(
  "/pings",
  validateRequest({ body: GeoPingBatchIngestSchema }),
  ingestGeoPingsHandler,
);

geoTrackingRoutes.get(
  "/resources/:resourceId/latest",
  validateRequest({ params: GeoResourceIdParamsSchema }),
  getLatestGeoPingHandler,
);

geoTrackingRoutes.get(
  "/resources/:resourceId/pings",
  validateRequest({ params: GeoResourceIdParamsSchema, query: GeoPingsQuerySchema }),
  listGeoPingsHandler,
);
