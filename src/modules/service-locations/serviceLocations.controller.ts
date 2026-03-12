import { AppError } from "../../shared/errors.js";

import {
  ServiceLocationCreateSchema,
  ServiceLocationIdParamsSchema,
  ServiceLocationsListQuerySchema,
  ServiceLocationUpdateSchema,
  type ServiceLocationIdParams,
} from "./dto/serviceLocations.dto.js";
import {
  createServiceLocation,
  deleteServiceLocation,
  getServiceLocation,
  listServiceLocations,
  updateServiceLocation,
} from "./serviceLocations.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listServiceLocationsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = ServiceLocationsListQuerySchema.parse(req.query);
    const result = await listServiceLocations(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getServiceLocationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceLocationIdParams;
    ServiceLocationIdParamsSchema.parse(req.params);
    const result = await getServiceLocation(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createServiceLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = ServiceLocationCreateSchema.parse(req.body);
    const result = await createServiceLocation(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateServiceLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceLocationIdParams;
    ServiceLocationIdParamsSchema.parse(req.params);
    const dto = ServiceLocationUpdateSchema.parse(req.body);
    const result = await updateServiceLocation(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteServiceLocationHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceLocationIdParams;
    ServiceLocationIdParamsSchema.parse(req.params);
    const result = await deleteServiceLocation(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
