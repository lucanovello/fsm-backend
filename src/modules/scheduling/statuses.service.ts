import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  BookingStatusCreateInput,
  BookingStatusesListQuery,
  BookingStatusUpdateInput,
} from "./dto/statuses.dto.js";

const statusNotFound = () =>
  new AppError("Booking status not found", 404, { code: "BOOKING_STATUS_NOT_FOUND" });

const statusNameTaken = () =>
  new AppError("Booking status name already exists", 409, { code: "BOOKING_STATUS_NAME_TAKEN" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

export async function listBookingStatuses(orgId: string, query: BookingStatusesListQuery) {
  const where: Prisma.BookingStatusWhereInput = {
    orgId,
    ...(query.includeInactive ? {} : { isActive: true }),
  };

  const statuses = await prisma.bookingStatus.findMany({
    where,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      isDefault: true,
      isActive: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { statuses };
}

export async function createBookingStatus(orgId: string, input: BookingStatusCreateInput) {
  try {
    const status = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.bookingStatus.updateMany({
          where: { orgId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.bookingStatus.create({
        data: {
          orgId,
          name: input.name,
          description: input.description ?? null,
          isDefault: input.isDefault ?? false,
          isActive: input.isActive ?? true,
          sortOrder: input.sortOrder ?? 0,
        },
        select: {
          id: true,
          name: true,
          description: true,
          isDefault: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return { status };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw statusNameTaken();
    }
    throw err;
  }
}

export async function updateBookingStatus(
  orgId: string,
  id: string,
  input: BookingStatusUpdateInput,
) {
  const existing = await prisma.bookingStatus.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw statusNotFound();
  }

  const data: Prisma.BookingStatusUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

  try {
    const status = await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.bookingStatus.updateMany({
          where: { orgId, isDefault: true, NOT: { id: existing.id } },
          data: { isDefault: false },
        });
      }

      return tx.bookingStatus.update({
        where: { id: existing.id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          isDefault: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    return { status };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw statusNameTaken();
    }
    throw err;
  }
}
