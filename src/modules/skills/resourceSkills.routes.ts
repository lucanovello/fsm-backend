import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { ResourceSkillsParamsSchema, ResourceSkillsReplaceSchema } from "./dto/skills.dto.js";
import { listResourceSkillsHandler, replaceResourceSkillsHandler } from "./skills.controller.js";

export const resourceSkillsRoutes = Router();

resourceSkillsRoutes.get(
  "/:id/skills",
  validateRequest({ params: ResourceSkillsParamsSchema }),
  listResourceSkillsHandler,
);

resourceSkillsRoutes.put(
  "/:id/skills",
  validateRequest({ params: ResourceSkillsParamsSchema, body: ResourceSkillsReplaceSchema }),
  replaceResourceSkillsHandler,
);
