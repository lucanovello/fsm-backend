import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  SkillsListQuerySchema,
  SkillCreateSchema,
  SkillIdParamsSchema,
  SkillUpdateSchema,
} from "./dto/skills.dto.js";
import {
  createSkillHandler,
  deleteSkillHandler,
  getSkillHandler,
  listSkillsHandler,
  updateSkillHandler,
} from "./skills.controller.js";

export const skillsRoutes = Router();

skillsRoutes.get("/", validateRequest({ query: SkillsListQuerySchema }), listSkillsHandler);
skillsRoutes.post("/", validateRequest({ body: SkillCreateSchema }), createSkillHandler);
skillsRoutes.get("/:id", validateRequest({ params: SkillIdParamsSchema }), getSkillHandler);
skillsRoutes.patch(
  "/:id",
  validateRequest({ params: SkillIdParamsSchema, body: SkillUpdateSchema }),
  updateSkillHandler,
);
skillsRoutes.delete("/:id", validateRequest({ params: SkillIdParamsSchema }), deleteSkillHandler);
