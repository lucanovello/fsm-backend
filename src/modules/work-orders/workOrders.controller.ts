import { AppError } from "../../shared/errors.js";

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
  type WorkOrderIdParams,
  type WorkOrderIncidentParams,
  type WorkOrderLineItemParams,
  type WorkOrderTaskParams,
} from "./dto/workOrders.dto.js";
import {
  addWorkOrderLineItem,
  addWorkOrderIncident,
  addWorkOrderNote,
  deleteWorkOrderLineItem,
  getWorkOrderDetail,
  listWorkOrderLineItems,
  listWorkOrderNotes,
  instantiateWorkOrderTasks,
  listWorkOrders,
  updateWorkOrderLineItem,
  updateWorkOrderTaskStatus,
} from "./workOrders.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

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

export async function addWorkOrderIncidentHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);
    const dto = WorkOrderIncidentCreateSchema.parse(req.body);

    const result = await addWorkOrderIncident(req.org.id, id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function instantiateWorkOrderTasksHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, incidentId } = req.params as WorkOrderIncidentParams;
    WorkOrderIncidentParamsSchema.parse(req.params);
    const dto = WorkOrderTaskInstantiateSchema.parse(req.body);

    const result = await instantiateWorkOrderTasks(req.org.id, id, incidentId, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkOrderTaskStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, taskId } = req.params as WorkOrderTaskParams;
    WorkOrderTaskParamsSchema.parse(req.params);
    const dto = WorkOrderTaskStatusUpdateSchema.parse(req.body);

    const result = await updateWorkOrderTaskStatus(req.org.id, id, taskId, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listWorkOrderNotesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);
    const result = await listWorkOrderNotes(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addWorkOrderNoteHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }
    if (!req.user) {
      throw new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
    }

    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);
    const dto = WorkOrderNoteCreateSchema.parse(req.body);
    const result = await addWorkOrderNote(req.org.id, id, req.user.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function listWorkOrderLineItemsHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);
    const result = await listWorkOrderLineItems(req.org.id, id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function addWorkOrderLineItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as WorkOrderIdParams;
    WorkOrderIdParamsSchema.parse(req.params);
    const dto = WorkOrderLineItemCreateSchema.parse(req.body);
    const result = await addWorkOrderLineItem(req.org.id, id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateWorkOrderLineItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, lineItemId } = req.params as WorkOrderLineItemParams;
    WorkOrderLineItemParamsSchema.parse(req.params);
    const dto = WorkOrderLineItemUpdateSchema.parse(req.body);
    const result = await updateWorkOrderLineItem(req.org.id, id, lineItemId, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkOrderLineItemHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id, lineItemId } = req.params as WorkOrderLineItemParams;
    WorkOrderLineItemParamsSchema.parse(req.params);
    const result = await deleteWorkOrderLineItem(req.org.id, id, lineItemId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
