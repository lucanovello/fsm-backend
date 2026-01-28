import { AppError } from "../../shared/errors.js";

import {
  InvoiceCreateSchema,
  InvoiceIdParamsSchema,
  InvoiceLineIdParamsSchema,
  InvoiceLineInputSchema,
  InvoiceLineUpdateSchema,
  InvoiceStatusUpdateSchema,
  InvoiceWorkOrderIdParamsSchema,
  InvoiceWorkOrdersAddSchema,
  type InvoiceIdParams,
  type InvoiceLineIdParams,
  type InvoiceWorkOrderIdParams,
} from "./dto/invoices.dto.js";
import {
  addInvoiceWorkOrders,
  createInvoice,
  createInvoiceLine,
  deleteInvoiceLine,
  getInvoice,
  removeInvoiceWorkOrder,
  updateInvoiceLine,
  updateInvoiceStatus,
} from "./invoices.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function getInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as InvoiceIdParams;
    InvoiceIdParamsSchema.parse(req.params);

    const result = await getInvoice(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createInvoiceHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = InvoiceCreateSchema.parse(req.body);
    const result = await createInvoice(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addInvoiceWorkOrdersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as InvoiceIdParams;
    InvoiceIdParamsSchema.parse(req.params);
    const dto = InvoiceWorkOrdersAddSchema.parse(req.body);

    const result = await addInvoiceWorkOrders(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function removeInvoiceWorkOrderHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, workOrderId } = req.params as InvoiceWorkOrderIdParams;
    InvoiceWorkOrderIdParamsSchema.parse(req.params);

    const result = await removeInvoiceWorkOrder(req.org.id, id, workOrderId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createInvoiceLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as InvoiceIdParams;
    InvoiceIdParamsSchema.parse(req.params);
    const dto = InvoiceLineInputSchema.parse(req.body);

    const result = await createInvoiceLine(req.org.id, id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoiceLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, lineId } = req.params as InvoiceLineIdParams;
    InvoiceLineIdParamsSchema.parse(req.params);
    const dto = InvoiceLineUpdateSchema.parse(req.body);

    const result = await updateInvoiceLine(req.org.id, id, lineId, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoiceLineHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, lineId } = req.params as InvoiceLineIdParams;
    InvoiceLineIdParamsSchema.parse(req.params);

    const result = await deleteInvoiceLine(req.org.id, id, lineId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoiceStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as InvoiceIdParams;
    InvoiceIdParamsSchema.parse(req.params);
    const dto = InvoiceStatusUpdateSchema.parse(req.body);

    const result = await updateInvoiceStatus(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
