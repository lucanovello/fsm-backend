import { AppError } from "../../shared/errors.js";

import {
  ServiceResourceCreateSchema,
  ServiceResourceIdParamsSchema,
  ServiceResourceUpdateSchema,
  ServiceResourcesListQuerySchema,
  type ServiceResourceIdParams,
} from "./dto/serviceResources.dto.js";
import {
  createServiceResource,
  deleteServiceResource,
  getServiceResource,
  listServiceResources,
  updateServiceResource,
} from "./serviceResources.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listServiceResourcesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = ServiceResourcesListQuerySchema.parse(req.query);
    const result = await listServiceResources(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getServiceResourceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceResourceIdParams;
    ServiceResourceIdParamsSchema.parse(req.params);

    const result = await getServiceResource(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createServiceResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = ServiceResourceCreateSchema.parse(req.body);
    const result = await createServiceResource(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateServiceResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceResourceIdParams;
    ServiceResourceIdParamsSchema.parse(req.params);
    const dto = ServiceResourceUpdateSchema.parse(req.body);

    const result = await updateServiceResource(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteServiceResourceHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceResourceIdParams;
    ServiceResourceIdParamsSchema.parse(req.params);

    const result = await deleteServiceResource(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
