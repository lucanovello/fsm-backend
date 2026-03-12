import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  WorkOrderIdParamsSchema,
  WorkOrderIncidentCreateSchema,
  WorkOrderIncidentParamsSchema,
  WorkOrderLineItemCreateSchema,
  WorkOrderLineItemParamsSchema,
  WorkOrderLineItemUpdateSchema,
  WorkOrderNoteCreateSchema,
  WorkOrderTaskInstantiateSchema,
  WorkOrderTaskParamsSchema,
  WorkOrderTaskStatusUpdateSchema,
  WorkOrdersListQuerySchema,
} from "./dto/workOrders.dto.js";
import {
  addWorkOrderIncidentHandler,
  addWorkOrderLineItemHandler,
  addWorkOrderNoteHandler,
  deleteWorkOrderLineItemHandler,
  getWorkOrderDetailHandler,
  instantiateWorkOrderTasksHandler,
  listWorkOrderLineItemsHandler,
  listWorkOrderNotesHandler,
  listWorkOrdersHandler,
  updateWorkOrderLineItemHandler,
  updateWorkOrderTaskStatusHandler,
} from "./workOrders.controller.js";

export const workOrdersRoutes = Router();

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

workOrdersRoutes.get(
  "/:id/notes",
  validateRequest({ params: WorkOrderIdParamsSchema }),
  listWorkOrderNotesHandler,
);

workOrdersRoutes.post(
  "/:id/notes",
  validateRequest({ params: WorkOrderIdParamsSchema, body: WorkOrderNoteCreateSchema }),
  addWorkOrderNoteHandler,
);

workOrdersRoutes.get(
  "/:id/line-items",
  validateRequest({ params: WorkOrderIdParamsSchema }),
  listWorkOrderLineItemsHandler,
);

workOrdersRoutes.post(
  "/:id/line-items",
  validateRequest({ params: WorkOrderIdParamsSchema, body: WorkOrderLineItemCreateSchema }),
  addWorkOrderLineItemHandler,
);

workOrdersRoutes.patch(
  "/:id/line-items/:lineItemId",
  validateRequest({ params: WorkOrderLineItemParamsSchema, body: WorkOrderLineItemUpdateSchema }),
  updateWorkOrderLineItemHandler,
);

workOrdersRoutes.delete(
  "/:id/line-items/:lineItemId",
  validateRequest({ params: WorkOrderLineItemParamsSchema }),
  deleteWorkOrderLineItemHandler,
);
