import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  GeoDeviceCreateInput,
  GeoPingBatchIngestInput,
  GeoPingsQuery,
} from "./dto/geoTracking.dto.js";

const serviceResourceNotFound = () =>
  new AppError("Service resource not found", 404, { code: "SERVICE_RESOURCE_NOT_FOUND" });

const geoDeviceNotFound = () =>
  new AppError("Geo device not found", 404, { code: "GEO_DEVICE_NOT_FOUND" });

const geoDeviceIdentifierTaken = () =>
  new AppError("Geo device identifier already registered", 409, {
    code: "GEO_DEVICE_IDENTIFIER_TAKEN",
  });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const ensureServiceResource = async (orgId: string, id: string) => {
  const resource = await prisma.serviceResource.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!resource) {
    throw serviceResourceNotFound();
  }

  return resource;
};

export async function createGeoDevice(orgId: string, input: GeoDeviceCreateInput) {
  await ensureServiceResource(orgId, input.serviceResourceId);

  try {
    const device = await prisma.geoDevice.create({
      data: {
        orgId,
        serviceResourceId: input.serviceResourceId,
        deviceIdentifier: input.deviceIdentifier,
        label: input.label ?? null,
        isActive: input.isActive ?? true,
      },
      select: {
        id: true,
        serviceResourceId: true,
        deviceIdentifier: true,
        label: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { device };
  } catch (err) {
    if (isUniqueConstraintError(err, "deviceIdentifier")) {
      throw geoDeviceIdentifierTaken();
    }
    throw err;
  }
}

export async function ingestGeoPings(orgId: string, input: GeoPingBatchIngestInput) {
  const deviceIds = Array.from(new Set(input.pings.map((ping) => ping.deviceId)));

  const devices = await prisma.geoDevice.findMany({
    where: { id: { in: deviceIds }, orgId, isActive: true },
    select: { id: true, serviceResourceId: true },
  });

  if (devices.length !== deviceIds.length) {
    throw geoDeviceNotFound();
  }

  const deviceById = new Map(devices.map((device) => [device.id, device] as const));

  const data: Prisma.GeoPingCreateManyInput[] = input.pings.map((ping) => ({
    orgId,
    deviceId: ping.deviceId,
    serviceResourceId: deviceById.get(ping.deviceId)!.serviceResourceId,
    recordedAt: new Date(ping.recordedAt),
    latitude: ping.latitude,
    longitude: ping.longitude,
    accuracyMeters: ping.accuracyMeters ?? null,
    altitudeMeters: ping.altitudeMeters ?? null,
    speedMps: ping.speedMps ?? null,
    headingDeg: ping.headingDeg ?? null,
  }));

  const result = await prisma.geoPing.createMany({ data });

  return { inserted: result.count };
}

export async function getLatestGeoPing(orgId: string, resourceId: string) {
  await ensureServiceResource(orgId, resourceId);

  const ping = await prisma.geoPing.findFirst({
    where: { orgId, serviceResourceId: resourceId },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true,
      deviceId: true,
      serviceResourceId: true,
      recordedAt: true,
      latitude: true,
      longitude: true,
      accuracyMeters: true,
      altitudeMeters: true,
      speedMps: true,
      headingDeg: true,
      createdAt: true,
    },
  });

  return { ping: ping ?? null };
}

export async function listGeoPingsForResource(
  orgId: string,
  resourceId: string,
  query: GeoPingsQuery,
) {
  await ensureServiceResource(orgId, resourceId);

  const where: Prisma.GeoPingWhereInput = {
    orgId,
    serviceResourceId: resourceId,
  };

  if (query.from || query.to) {
    where.recordedAt = {
      gte: query.from ? new Date(query.from) : undefined,
      lte: query.to ? new Date(query.to) : undefined,
    };
  }

  const items = await prisma.geoPing.findMany({
    where,
    orderBy: { recordedAt: "desc" },
    take: query.limit,
    select: {
      id: true,
      deviceId: true,
      serviceResourceId: true,
      recordedAt: true,
      latitude: true,
      longitude: true,
      accuracyMeters: true,
      altitudeMeters: true,
      speedMps: true,
      headingDeg: true,
      createdAt: true,
    },
  });

  return { items, count: items.length };
}
