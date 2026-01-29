import { AppError } from "../../shared/errors.js";

import {
  GeoDeviceCreateSchema,
  GeoPingBatchIngestSchema,
  GeoPingsQuerySchema,
  GeoResourceIdParamsSchema,
  type GeoResourceIdParams,
} from "./dto/geoTracking.dto.js";
import {
  createGeoDevice,
  getLatestGeoPing,
  ingestGeoPings,
  listGeoPingsForResource,
} from "./geoTracking.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function createGeoDeviceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = GeoDeviceCreateSchema.parse(req.body);
    const result = await createGeoDevice(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function ingestGeoPingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = GeoPingBatchIngestSchema.parse(req.body);
    const result = await ingestGeoPings(req.org.id, dto);
    res.status(202).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getLatestGeoPingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { resourceId } = req.params as GeoResourceIdParams;
    GeoResourceIdParamsSchema.parse(req.params);

    const result = await getLatestGeoPing(req.org.id, resourceId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listGeoPingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { resourceId } = req.params as GeoResourceIdParams;
    GeoResourceIdParamsSchema.parse(req.params);
    const query = GeoPingsQuerySchema.parse(req.query);

    const result = await listGeoPingsForResource(req.org.id, resourceId, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
