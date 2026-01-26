import { AppError } from "../../shared/errors.js";

import { CreateOrganizationSchema } from "./dto/organizations.dto.js";
import { createOrganization, listOrganizations } from "./organizations.service.js";

import type { NextFunction, Request, Response } from "express";

export async function listOrganizationsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const result = await listOrganizations(req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createOrganizationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const dto = CreateOrganizationSchema.parse(req.body);
    const result = await createOrganization(req.user.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
