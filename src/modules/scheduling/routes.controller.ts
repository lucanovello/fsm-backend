import { AppError } from "../../shared/errors.js";

import {
  RouteCreateSchema,
  RouteIdParamsSchema,
  RouteStopAddSchema,
  RouteStopIdParamsSchema,
  RouteStopReorderSchema,
  type RouteIdParams,
  type RouteStopIdParams,
} from "./dto/routes.dto.js";
import { addRouteStop, createRoute, removeRouteStop, reorderRouteStops } from "./routes.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function createRouteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = RouteCreateSchema.parse(req.body);
    const result = await createRoute(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addRouteStopHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as RouteIdParams;
    RouteIdParamsSchema.parse(req.params);
    const dto = RouteStopAddSchema.parse(req.body);

    const result = await addRouteStop(req.org.id, id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function reorderRouteStopsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as RouteIdParams;
    RouteIdParamsSchema.parse(req.params);
    const dto = RouteStopReorderSchema.parse(req.body);

    const result = await reorderRouteStops(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeRouteStopHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, stopId } = req.params as RouteStopIdParams;
    RouteStopIdParamsSchema.parse(req.params);

    const result = await removeRouteStop(req.org.id, id, stopId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
