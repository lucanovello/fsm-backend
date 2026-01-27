import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  BookingCreateInput,
  BookingStatusChangeInput,
  BookingUpdateInput,
} from "./dto/bookings.dto.js";

const bookingNotFound = () => new AppError("Booking not found", 404, { code: "BOOKING_NOT_FOUND" });

const crewNotFound = () => new AppError("Crew not found", 404, { code: "CREW_NOT_FOUND" });

const statusNotFound = () =>
  new AppError("Booking status not found", 404, { code: "BOOKING_STATUS_NOT_FOUND" });

const defaultStatusMissing = () =>
  new AppError("Default booking status missing", 400, { code: "BOOKING_STATUS_DEFAULT_MISSING" });

const workOrderNotFound = () =>
  new AppError("Work order not found", 404, { code: "WORK_ORDER_NOT_FOUND" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const toDate = (value?: string | null): Date | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return new Date(value);
};

const ensureCrew = async (orgId: string, crewId: string) => {
  const crew = await prisma.crew.findFirst({ where: { id: crewId, orgId }, select: { id: true } });
  if (!crew) throw crewNotFound();
  return crew;
};

const ensureWorkOrder = async (orgId: string, workOrderId: string) => {
  const workOrder = await prisma.workOrder.findFirst({
    where: { id: workOrderId, orgId },
    select: { id: true },
  });

  if (!workOrder) throw workOrderNotFound();
  return workOrder;
};

const resolveStatus = async (orgId: string, statusId?: string) => {
  if (statusId) {
    const status = await prisma.bookingStatus.findFirst({
      where: { id: statusId, orgId },
      select: { id: true },
    });

    if (!status) throw statusNotFound();
    return status;
  }

  const status = await prisma.bookingStatus.findFirst({
    where: { orgId, isDefault: true, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (status) return status;

  const fallback = await prisma.bookingStatus.findFirst({
    where: { orgId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  if (!fallback) throw defaultStatusMissing();
  return fallback;
};

export async function createBooking(orgId: string, input: BookingCreateInput) {
  await ensureCrew(orgId, input.crewId);

  if (input.workOrderId) {
    await ensureWorkOrder(orgId, input.workOrderId);
  }

  const status = await resolveStatus(orgId, input.statusId);

  const requirements =
    input.requirements && input.requirements.length > 0
      ? input.requirements.map((req) => ({
          orgId,
          resourceType: req.resourceType,
          quantity: req.quantity ?? 1,
          notes: req.notes ?? null,
        }))
      : [{ orgId, resourceType: "CREW", quantity: 1, notes: null }];

  try {
    const booking = await prisma.booking.create({
      data: {
        orgId,
        workOrderId: input.workOrderId ?? null,
        crewId: input.crewId,
        statusId: status.id,
        scheduledStart: toDate(input.scheduledStart),
        scheduledEnd: toDate(input.scheduledEnd),
        requirements: {
          create: requirements,
        },
      },
      select: {
        id: true,
        workOrderId: true,
        crewId: true,
        statusId: true,
        scheduledStart: true,
        scheduledEnd: true,
        createdAt: true,
        updatedAt: true,
        requirements: {
          select: {
            id: true,
            resourceType: true,
            quantity: true,
            notes: true,
          },
        },
      },
    });

    return { booking };
  } catch (err) {
    if (isUniqueConstraintError(err, "workOrderId")) {
      throw new AppError("Booking already exists for work order", 409, {
        code: "BOOKING_ALREADY_EXISTS",
      });
    }
    throw err;
  }
}

export async function updateBooking(orgId: string, id: string, input: BookingUpdateInput) {
  const existing = await prisma.booking.findFirst({ where: { id, orgId }, select: { id: true } });

  if (!existing) {
    throw bookingNotFound();
  }

  if (input.crewId) {
    await ensureCrew(orgId, input.crewId);
  }

  const data: Prisma.BookingUpdateInput = {};

  if (input.crewId !== undefined) data.crew = { connect: { id: input.crewId } };
  if (input.scheduledStart !== undefined) data.scheduledStart = toDate(input.scheduledStart);
  if (input.scheduledEnd !== undefined) data.scheduledEnd = toDate(input.scheduledEnd);

  const booking = await prisma.booking.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      workOrderId: true,
      crewId: true,
      statusId: true,
      scheduledStart: true,
      scheduledEnd: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { booking };
}

export async function changeBookingStatus(
  orgId: string,
  id: string,
  input: BookingStatusChangeInput,
  orgMemberId?: string,
) {
  const booking = await prisma.booking.findFirst({
    where: { id, orgId },
    select: { id: true, statusId: true },
  });

  if (!booking) {
    throw bookingNotFound();
  }

  const status = await resolveStatus(orgId, input.statusId);

  if (booking.statusId === status.id) {
    const current = await prisma.booking.findFirst({
      where: { id: booking.id },
      select: {
        id: true,
        workOrderId: true,
        crewId: true,
        statusId: true,
        scheduledStart: true,
        scheduledEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { booking: current, event: null };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: booking.id },
      data: { statusId: status.id },
      select: {
        id: true,
        workOrderId: true,
        crewId: true,
        statusId: true,
        scheduledStart: true,
        scheduledEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const event = await tx.bookingStatusEvent.create({
      data: {
        orgId,
        bookingId: booking.id,
        statusId: status.id,
        orgMemberId: orgMemberId ?? null,
      },
      select: {
        id: true,
        bookingId: true,
        statusId: true,
        orgMemberId: true,
        createdAt: true,
      },
    });

    return { booking: updated, event };
  });

  return result;
}
