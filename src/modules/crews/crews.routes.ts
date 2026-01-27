import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  addCrewMemberHandler,
  createCrewHandler,
  deleteCrewHandler,
  getCrewDetailHandler,
  listCrewsHandler,
  removeCrewMemberHandler,
  updateCrewHandler,
} from "./crews.controller.js";
import {
  CrewCreateSchema,
  CrewIdParamsSchema,
  CrewMemberCreateSchema,
  CrewMemberParamsSchema,
  CrewUpdateSchema,
  CrewsListQuerySchema,
} from "./dto/crews.dto.js";

export const crewsRoutes = Router();

crewsRoutes.get("/", validateRequest({ query: CrewsListQuerySchema }), listCrewsHandler);

crewsRoutes.post("/", validateRequest({ body: CrewCreateSchema }), createCrewHandler);

crewsRoutes.get("/:id", validateRequest({ params: CrewIdParamsSchema }), getCrewDetailHandler);

crewsRoutes.patch(
  "/:id",
  validateRequest({ params: CrewIdParamsSchema, body: CrewUpdateSchema }),
  updateCrewHandler,
);

crewsRoutes.delete("/:id", validateRequest({ params: CrewIdParamsSchema }), deleteCrewHandler);

crewsRoutes.post(
  "/:id/members",
  validateRequest({ params: CrewIdParamsSchema, body: CrewMemberCreateSchema }),
  addCrewMemberHandler,
);

crewsRoutes.delete(
  "/:id/members/:resourceId",
  validateRequest({ params: CrewMemberParamsSchema }),
  removeCrewMemberHandler,
);
