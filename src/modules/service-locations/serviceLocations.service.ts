import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  ServiceLocationCreateInput,
  ServiceLocationsListQuery,
  ServiceLocationUpdateInput,
} from "./dto/serviceLocations.dto.js";

const locationNotFound = () =>
  new AppError("Service location not found", 404, { code: "SERVICE_LOCATION_NOT_FOUND" });

const customerNotFound = () => new AppError("Customer not found", 404, { code: "CUSTOMER_NOT_FOUND" });

const ensureCustomer = async (orgId: string, customerId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, orgId },
    select: { id: true },
  });
  if (!customer) {
    throw customerNotFound();
  }
  return customer;
};

export async function listServiceLocations(orgId: string, query: ServiceLocationsListQuery) {
  const { q, customerId, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ServiceLocationWhereInput = { orgId };
  if (customerId) {
    where.customerId = customerId;
  }
  if (q) {
    where.OR = [
      { label: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { addressLine1: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { city: { contains: q, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.serviceLocation.count({ where }),
    prisma.serviceLocation.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: [{ city: "asc" }, { addressLine1: "asc" }],
      select: {
        id: true,
        customerId: true,
        label: true,
        addressLine1: true,
        city: true,
        province: true,
        country: true,
        latitude: true,
        longitude: true,
        customer: { select: { id: true, name: true } },
      },
    }),
  ]);

  return { items, page, pageSize, total };
}

export async function getServiceLocation(orgId: string, id: string) {
  const location = await prisma.serviceLocation.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      customerId: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true } },
    },
  });

  if (!location) {
    throw locationNotFound();
  }

  return { location };
}

export async function createServiceLocation(orgId: string, input: ServiceLocationCreateInput) {
  await ensureCustomer(orgId, input.customerId);

  const location = await prisma.serviceLocation.create({
    data: {
      orgId,
      customerId: input.customerId,
      label: input.label ?? null,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2 ?? null,
      city: input.city,
      province: input.province ?? null,
      postalCode: input.postalCode ?? null,
      country: input.country ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
    },
    select: {
      id: true,
      customerId: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true } },
    },
  });

  return { location };
}

export async function updateServiceLocation(
  orgId: string,
  id: string,
  input: ServiceLocationUpdateInput,
) {
  if (input.customerId) {
    await ensureCustomer(orgId, input.customerId);
  }

  const existing = await prisma.serviceLocation.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw locationNotFound();
  }

  const data: Prisma.ServiceLocationUpdateInput = {};
  if (input.customerId !== undefined) data.customer = { connect: { id: input.customerId } };
  if (input.label !== undefined) data.label = input.label;
  if (input.addressLine1 !== undefined) data.addressLine1 = input.addressLine1;
  if (input.addressLine2 !== undefined) data.addressLine2 = input.addressLine2;
  if (input.city !== undefined) data.city = input.city;
  if (input.province !== undefined) data.province = input.province;
  if (input.postalCode !== undefined) data.postalCode = input.postalCode;
  if (input.country !== undefined) data.country = input.country;
  if (input.latitude !== undefined) data.latitude = input.latitude;
  if (input.longitude !== undefined) data.longitude = input.longitude;

  const location = await prisma.serviceLocation.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      customerId: true,
      label: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      latitude: true,
      longitude: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true } },
    },
  });

  return { location };
}

export async function deleteServiceLocation(orgId: string, id: string) {
  const result = await prisma.serviceLocation.deleteMany({
    where: { id, orgId },
  });

  if (result.count === 0) {
    throw locationNotFound();
  }

  return { deleted: true };
}
