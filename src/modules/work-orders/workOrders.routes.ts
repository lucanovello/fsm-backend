import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  WorkOrderIdParamsSchema,
  WorkOrderIncidentCreateSchema,
  WorkOrderIncidentParamsSchema,
  WorkOrderTaskInstantiateSchema,
  WorkOrderTaskParamsSchema,
  WorkOrderTaskStatusUpdateSchema,
  WorkOrdersListQuerySchema,
} from "./dto/workOrders.dto.js";
import {
  addWorkOrderIncidentHandler,
  getWorkOrderDetailHandler,
  instantiateWorkOrderTasksHandler,
  listWorkOrdersHandler,
  updateWorkOrderTaskStatusHandler,
} from "./workOrders.controller.js";

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

workOrdersRoutes.post(
  "/:id/incidents",
  validateRequest({ params: WorkOrderIdParamsSchema, body: WorkOrderIncidentCreateSchema }),
  addWorkOrderIncidentHandler,
);

workOrdersRoutes.post(
  "/:id/incidents/:incidentId/tasks/instantiate",
  validateRequest({ params: WorkOrderIncidentParamsSchema, body: WorkOrderTaskInstantiateSchema }),
  instantiateWorkOrderTasksHandler,
);

workOrdersRoutes.patch(
  "/:id/tasks/:taskId/status",
  validateRequest({ params: WorkOrderTaskParamsSchema, body: WorkOrderTaskStatusUpdateSchema }),
  updateWorkOrderTaskStatusHandler,
);
