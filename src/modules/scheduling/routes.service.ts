import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  RouteCreateInput,
  RouteStopAddInput,
  RouteStopReorderInput,
} from "./dto/routes.dto.js";

const routeNotFound = () => new AppError("Route not found", 404, { code: "ROUTE_NOT_FOUND" });

const crewNotFound = () => new AppError("Crew not found", 404, { code: "CREW_NOT_FOUND" });

const bookingNotFound = () => new AppError("Booking not found", 404, { code: "BOOKING_NOT_FOUND" });

const bookingCrewMismatch = () =>
  new AppError("Booking crew does not match route", 409, { code: "BOOKING_CREW_MISMATCH" });

const routeStopNotFound = () =>
  new AppError("Route stop not found", 404, { code: "ROUTE_STOP_NOT_FOUND" });

const invalidStopOrder = () =>
  new AppError("Route stop order is invalid", 400, { code: "ROUTE_STOP_ORDER_INVALID" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const ensureCrew = async (orgId: string, crewId: string) => {
  const crew = await prisma.crew.findFirst({ where: { id: crewId, orgId }, select: { id: true } });
  if (!crew) throw crewNotFound();
  return crew;
};

const ensureRoute = async (orgId: string, routeId: string) => {
  const route = await prisma.route.findFirst({
    where: { id: routeId, orgId },
    select: { id: true, crewId: true },
  });

  if (!route) throw routeNotFound();
  return route;
};

const ensureBooking = async (orgId: string, bookingId: string) => {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, orgId },
    select: { id: true, crewId: true },
  });

  if (!booking) throw bookingNotFound();
  return booking;
};

export async function createRoute(orgId: string, input: RouteCreateInput) {
  await ensureCrew(orgId, input.crewId);

  const routeDate = new Date(input.routeDate);

  try {
    const route = await prisma.route.create({
      data: { orgId, crewId: input.crewId, routeDate },
      select: {
        id: true,
        crewId: true,
        routeDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { route };
  } catch (err) {
    if (isUniqueConstraintError(err, "routeDate")) {
      throw new AppError("Route already exists for crew/date", 409, {
        code: "ROUTE_ALREADY_EXISTS",
      });
    }
    throw err;
  }
}

export async function addRouteStop(orgId: string, routeId: string, input: RouteStopAddInput) {
  const route = await ensureRoute(orgId, routeId);
  const booking = await ensureBooking(orgId, input.bookingId);

  if (route.crewId !== booking.crewId) {
    throw bookingCrewMismatch();
  }

  const lastStop = await prisma.routeStop.findFirst({
    where: { orgId, routeId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  const position = (lastStop?.position ?? 0) + 1;

  try {
    const stop = await prisma.routeStop.create({
      data: {
        orgId,
        routeId,
        bookingId: input.bookingId,
        position,
      },
      select: {
        id: true,
        routeId: true,
        bookingId: true,
        position: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { stop };
  } catch (err) {
    if (isUniqueConstraintError(err, "bookingId")) {
      throw new AppError("Booking already assigned to a route", 409, {
        code: "BOOKING_ALREADY_ROUTED",
      });
    }
    throw err;
  }
}

export async function reorderRouteStops(
  orgId: string,
  routeId: string,
  input: RouteStopReorderInput,
) {
  await ensureRoute(orgId, routeId);

  const stops = await prisma.routeStop.findMany({
    where: { orgId, routeId, id: { in: input.stopIds } },
    select: { id: true },
  });

  if (stops.length !== input.stopIds.length) {
    throw invalidStopOrder();
  }

  await prisma.$transaction(
    input.stopIds.map((stopId, index) =>
      prisma.routeStop.update({
        where: { id: stopId },
        data: { position: index + 1 },
      }),
    ),
  );

  const updated = await prisma.routeStop.findMany({
    where: { orgId, routeId },
    orderBy: { position: "asc" },
    select: {
      id: true,
      routeId: true,
      bookingId: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { stops: updated };
}

export async function removeRouteStop(orgId: string, routeId: string, stopId: string) {
  const result = await prisma.routeStop.deleteMany({
    where: { id: stopId, orgId, routeId },
  });

  if (result.count === 0) {
    throw routeStopNotFound();
  }

  const remaining = (await prisma.routeStop.findMany({
    where: { orgId, routeId },
    orderBy: { position: "asc" },
    select: { id: true },
  })) as Array<{ id: string }>;

  await prisma.$transaction(
    remaining.map((stop, index) =>
      prisma.routeStop.update({
        where: { id: stop.id },
        data: { position: index + 1 },
      }),
    ),
  );

  return { deleted: true };
}
