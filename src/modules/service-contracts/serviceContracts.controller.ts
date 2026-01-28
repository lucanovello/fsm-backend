import { AppError } from "../../shared/errors.js";

import {
  ServiceContractCreateSchema,
  ServiceContractIdParamsSchema,
  ServiceContractMaterializeSchema,
  ServiceContractsListQuerySchema,
  ServiceContractUpdateSchema,
  type ServiceContractIdParams,
} from "./dto/serviceContracts.dto.js";
import {
  createServiceContract,
  deleteServiceContract,
  getServiceContract,
  listServiceContracts,
  materializeServiceContractOccurrences,
  updateServiceContract,
} from "./serviceContracts.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listServiceContractsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = ServiceContractsListQuerySchema.parse(req.query);
    const result = await listServiceContracts(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getServiceContractHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceContractIdParams;
    ServiceContractIdParamsSchema.parse(req.params);

    const result = await getServiceContract(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createServiceContractHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = ServiceContractCreateSchema.parse(req.body);
    const result = await createServiceContract(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateServiceContractHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceContractIdParams;
    ServiceContractIdParamsSchema.parse(req.params);
    const dto = ServiceContractUpdateSchema.parse(req.body);

    const result = await updateServiceContract(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteServiceContractHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceContractIdParams;
    ServiceContractIdParamsSchema.parse(req.params);

    const result = await deleteServiceContract(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function materializeServiceContractHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ServiceContractIdParams;
    ServiceContractIdParamsSchema.parse(req.params);
    const dto = ServiceContractMaterializeSchema.parse(req.body ?? {});

    const result = await materializeServiceContractOccurrences(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
