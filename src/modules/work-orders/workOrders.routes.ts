import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { WorkOrderIdParamsSchema, WorkOrdersListQuerySchema } from "./dto/workOrders.dto.js";
import { getWorkOrderDetailHandler, listWorkOrdersHandler } from "./workOrders.controller.js";

export const workOrdersRoutes = Router();

// workOrdersRoutes.get("/", async (req, res, next) => {
//   res.status(200).json("Hello Work Orders!");
// });

workOrdersRoutes.get(
  "/",
  validateRequest({ query: WorkOrdersListQuerySchema }),
  listWorkOrdersHandler,
);

workOrdersRoutes.get(
  "/:id",
  validateRequest({ params: WorkOrderIdParamsSchema }),
  getWorkOrderDetailHandler,
);
