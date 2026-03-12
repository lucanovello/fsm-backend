import { AppError } from "../../shared/errors.js";

import {
  ResourceSkillsParamsSchema,
  ResourceSkillsReplaceSchema,
  SkillsListQuerySchema,
  SkillCreateSchema,
  SkillIdParamsSchema,
  SkillUpdateSchema,
  type ResourceSkillsParams,
  type SkillIdParams,
} from "./dto/skills.dto.js";
import {
  createSkill,
  deleteSkill,
  getSkill,
  listResourceSkills,
  listSkills,
  replaceResourceSkills,
  updateSkill,
} from "./skills.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listSkillsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = SkillsListQuerySchema.parse(req.query);
    const result = await listSkills(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSkillHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as SkillIdParams;
    SkillIdParamsSchema.parse(req.params);
    const result = await getSkill(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createSkillHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = SkillCreateSchema.parse(req.body);
    const result = await createSkill(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateSkillHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as SkillIdParams;
    SkillIdParamsSchema.parse(req.params);
    const dto = SkillUpdateSchema.parse(req.body);
    const result = await updateSkill(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteSkillHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as SkillIdParams;
    SkillIdParamsSchema.parse(req.params);
    const result = await deleteSkill(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listResourceSkillsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ResourceSkillsParams;
    ResourceSkillsParamsSchema.parse(req.params);
    const result = await listResourceSkills(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function replaceResourceSkillsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as ResourceSkillsParams;
    ResourceSkillsParamsSchema.parse(req.params);
    const dto = ResourceSkillsReplaceSchema.parse(req.body);
    const result = await replaceResourceSkills(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
