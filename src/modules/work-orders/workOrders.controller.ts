import {
  WorkOrderIdParamsSchema,
  WorkOrdersListQuerySchema,
  type WorkOrderIdParams,
} from "./dto/workOrders.dto.js";
import { getWorkOrderDetail, listWorkOrders } from "./workOrders.service.js";

import type { NextFunction, Request, Response } from "express";

export async function listWorkOrdersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = WorkOrdersListQuerySchema.parse(req.query);
    const result = await listWorkOrders(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getWorkOrderDetailHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);

    const result = await getWorkOrderDetail(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
