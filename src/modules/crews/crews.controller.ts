import { AppError } from "../../shared/errors.js";

import {
  addCrewMember,
  createCrew,
  deleteCrew,
  getCrewDetail,
  listCrews,
  removeCrewMember,
  updateCrew,
} from "./crews.service.js";
import {
  CrewCreateSchema,
  CrewIdParamsSchema,
  CrewMemberCreateSchema,
  CrewMemberParamsSchema,
  CrewUpdateSchema,
  CrewsListQuerySchema,
  type CrewIdParams,
  type CrewMemberParams,
} from "./dto/crews.dto.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listCrewsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = CrewsListQuerySchema.parse(req.query);
    const result = await listCrews(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCrewDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as CrewIdParams;
    CrewIdParamsSchema.parse(req.params);

    const result = await getCrewDetail(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createCrewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = CrewCreateSchema.parse(req.body);
    const result = await createCrew(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateCrewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as CrewIdParams;
    CrewIdParamsSchema.parse(req.params);
    const dto = CrewUpdateSchema.parse(req.body);

    const result = await updateCrew(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteCrewHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as CrewIdParams;
    CrewIdParamsSchema.parse(req.params);

    const result = await deleteCrew(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addCrewMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as CrewIdParams;
    CrewIdParamsSchema.parse(req.params);
    const dto = CrewMemberCreateSchema.parse(req.body);

    const result = await addCrewMember(req.org.id, id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeCrewMemberHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, resourceId } = req.params as CrewMemberParams;
    CrewMemberParamsSchema.parse(req.params);

    const result = await removeCrewMember(req.org.id, id, resourceId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
