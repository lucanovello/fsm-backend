import { AppError } from "../../shared/errors.js";

import { changeBookingStatus, createBooking, updateBooking } from "./bookings.service.js";
import {
  BookingCreateSchema,
  BookingIdParamsSchema,
  BookingStatusChangeSchema,
  BookingUpdateSchema,
  type BookingIdParams,
} from "./dto/bookings.dto.js";

import type { NextFunction, Request, Response } from "express";

const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export async function createBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const dto = BookingCreateSchema.parse(req.body);
    const result = await createBooking(req.org.id, dto);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function updateBookingHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as BookingIdParams;
    BookingIdParamsSchema.parse(req.params);
    const dto = BookingUpdateSchema.parse(req.body);

    const result = await updateBooking(req.org.id, id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function changeBookingStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.org) {
      throw orgRequired();
    }

    const { id } = req.params as BookingIdParams;
    BookingIdParamsSchema.parse(req.params);
    const dto = BookingStatusChangeSchema.parse(req.body);

    const result = await changeBookingStatus(req.org.id, id, dto, req.org.membershipId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
