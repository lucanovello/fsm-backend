import { TechniciansListQuerySchema } from "./dto/technicians.dto.js";
import { listTechnicians } from "./technicians.service.js";

import type { NextFunction, Request, Response } from "express";

export async function listTechniciansHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = TechniciansListQuerySchema.parse(req.query);
    const result = await listTechnicians(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
