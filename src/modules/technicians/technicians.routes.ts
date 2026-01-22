import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { TechniciansListQuerySchema } from "./dto/technicians.dto.js";
import { listTechniciansHandler } from "./technicians.controller.js";

export const techniciansRoutes = Router();

// techniciansRoutes.get("/", async (req, res, next) => {
//   res.status(200).json("Hello Technicians!");
// });

techniciansRoutes.get(
  "/",
  validateRequest({ query: TechniciansListQuerySchema }),
  listTechniciansHandler,
);
