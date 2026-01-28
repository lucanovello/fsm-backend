import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  InvoiceCreateSchema,
  InvoiceIdParamsSchema,
  InvoiceLineIdParamsSchema,
  InvoiceLineInputSchema,
  InvoiceLineUpdateSchema,
  InvoiceStatusUpdateSchema,
  InvoiceWorkOrderIdParamsSchema,
  InvoiceWorkOrdersAddSchema,
} from "./dto/invoices.dto.js";
import {
  addInvoiceWorkOrdersHandler,
  createInvoiceHandler,
  createInvoiceLineHandler,
  deleteInvoiceLineHandler,
  getInvoiceHandler,
  removeInvoiceWorkOrderHandler,
  updateInvoiceLineHandler,
  updateInvoiceStatusHandler,
} from "./invoices.controller.js";

export const invoicesRoutes = Router();

invoicesRoutes.post("/", validateRequest({ body: InvoiceCreateSchema }), createInvoiceHandler);

invoicesRoutes.get("/:id", validateRequest({ params: InvoiceIdParamsSchema }), getInvoiceHandler);

invoicesRoutes.post(
  "/:id/work-orders",
  validateRequest({ params: InvoiceIdParamsSchema, body: InvoiceWorkOrdersAddSchema }),
  addInvoiceWorkOrdersHandler,
);

invoicesRoutes.delete(
  "/:id/work-orders/:workOrderId",
  validateRequest({ params: InvoiceWorkOrderIdParamsSchema }),
  removeInvoiceWorkOrderHandler,
);

invoicesRoutes.post(
  "/:id/lines",
  validateRequest({ params: InvoiceIdParamsSchema, body: InvoiceLineInputSchema }),
  createInvoiceLineHandler,
);

invoicesRoutes.patch(
  "/:id/lines/:lineId",
  validateRequest({ params: InvoiceLineIdParamsSchema, body: InvoiceLineUpdateSchema }),
  updateInvoiceLineHandler,
);

invoicesRoutes.delete(
  "/:id/lines/:lineId",
  validateRequest({ params: InvoiceLineIdParamsSchema }),
  deleteInvoiceLineHandler,
);

invoicesRoutes.patch(
  "/:id/status",
  validateRequest({ params: InvoiceIdParamsSchema, body: InvoiceStatusUpdateSchema }),
  updateInvoiceStatusHandler,
);
