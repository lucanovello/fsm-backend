import { AppError } from "../../shared/errors.js";

import {
  WorkTemplateCreateSchema,
  WorkTemplateIdParamsSchema,
  WorkTemplateUpdateSchema,
  WorkTemplatesListQuerySchema,
  type WorkTemplateIdParams,
} from "./dto/workTemplates.dto.js";
import {
  createWorkTemplate,
  deleteWorkTemplate,
  getWorkTemplate,
  listWorkTemplates,
  updateWorkTemplate,
} from "./workTemplates.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listWorkTemplatesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = WorkTemplatesListQuerySchema.parse(req.query);
    const result = await listWorkTemplates(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getWorkTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkTemplateIdParams;
    WorkTemplateIdParamsSchema.parse(req.params);

    const result = await getWorkTemplate(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createWorkTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = WorkTemplateCreateSchema.parse(req.body);
    const result = await createWorkTemplate(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkTemplateIdParams;
    WorkTemplateIdParamsSchema.parse(req.params);
    const dto = WorkTemplateUpdateSchema.parse(req.body);

    const result = await updateWorkTemplate(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkTemplateHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkTemplateIdParams;
    WorkTemplateIdParamsSchema.parse(req.params);

    const result = await deleteWorkTemplate(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
