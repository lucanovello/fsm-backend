import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  changeBookingStatusHandler,
  createBookingHandler,
  updateBookingHandler,
} from "./bookings.controller.js";
import {
  BookingCreateSchema,
  BookingIdParamsSchema,
  BookingStatusChangeSchema,
  BookingUpdateSchema,
} from "./dto/bookings.dto.js";
import {
  RouteCreateSchema,
  RouteIdParamsSchema,
  RouteStopAddSchema,
  RouteStopIdParamsSchema,
  RouteStopReorderSchema,
} from "./dto/routes.dto.js";
import {
  addRouteStopHandler,
  createRouteHandler,
  removeRouteStopHandler,
  reorderRouteStopsHandler,
} from "./routes.controller.js";

export const schedulingRoutes = Router();

schedulingRoutes.post(
  "/bookings",
  validateRequest({ body: BookingCreateSchema }),
  createBookingHandler,
);

schedulingRoutes.patch(
  "/bookings/:id",
  validateRequest({ params: BookingIdParamsSchema, body: BookingUpdateSchema }),
  updateBookingHandler,
);

schedulingRoutes.post(
  "/bookings/:id/status",
  validateRequest({ params: BookingIdParamsSchema, body: BookingStatusChangeSchema }),
  changeBookingStatusHandler,
);

schedulingRoutes.post("/routes", validateRequest({ body: RouteCreateSchema }), createRouteHandler);

schedulingRoutes.post(
  "/routes/:id/stops",
  validateRequest({ params: RouteIdParamsSchema, body: RouteStopAddSchema }),
  addRouteStopHandler,
);

schedulingRoutes.patch(
  "/routes/:id/stops/reorder",
  validateRequest({ params: RouteIdParamsSchema, body: RouteStopReorderSchema }),
  reorderRouteStopsHandler,
);

schedulingRoutes.delete(
  "/routes/:id/stops/:stopId",
  validateRequest({ params: RouteStopIdParamsSchema }),
  removeRouteStopHandler,
);
