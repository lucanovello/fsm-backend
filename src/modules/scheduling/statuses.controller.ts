import { AppError } from "../../shared/errors.js";

import {
  BookingStatusCreateSchema,
  BookingStatusIdParamsSchema,
  BookingStatusesListQuerySchema,
  BookingStatusUpdateSchema,
  type BookingStatusIdParams,
} from "./dto/statuses.dto.js";
import {
  createBookingStatus,
  listBookingStatuses,
  updateBookingStatus,
} from "./statuses.service.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function listBookingStatusesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const query = BookingStatusesListQuerySchema.parse(req.query);
    const result = await listBookingStatuses(req.org.id, query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function createBookingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = BookingStatusCreateSchema.parse(req.body);
    const result = await createBookingStatus(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateBookingStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as BookingStatusIdParams;
    BookingStatusIdParamsSchema.parse(req.params);
    const dto = BookingStatusUpdateSchema.parse(req.body);
    const result = await updateBookingStatus(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
