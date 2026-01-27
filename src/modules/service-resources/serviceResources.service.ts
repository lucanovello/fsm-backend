import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  ServiceResourceCreateInput,
  ServiceResourceUpdateInput,
  ServiceResourcesListQuery,
} from "./dto/serviceResources.dto.js";

const notFound = () =>
  new AppError("Service resource not found", 404, {
    code: "SERVICE_RESOURCE_NOT_FOUND",
  });

const orgMemberNotFound = () =>
  new AppError("Org member not found", 404, { code: "ORG_MEMBER_NOT_FOUND" });

const orgMemberTaken = () =>
  new AppError("Org member already assigned", 409, { code: "ORG_MEMBER_ASSIGNED" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const ensureOrgMember = async (orgId: string, orgMemberId: string) => {
  const member = await prisma.orgMember.findFirst({
    where: { id: orgMemberId, orgId },
    select: { id: true },
  });
  if (!member) {
    throw orgMemberNotFound();
  }
  return member;
};

export async function listServiceResources(orgId: string, query: ServiceResourcesListQuery) {
  const { q, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ServiceResourceWhereInput = {
    orgId,
  };

  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.serviceResource.count({ where }),
    prisma.serviceResource.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        isActive: true,
        orgMemberId: true,
      },
    }),
  ]);

  return { items, page, pageSize, total };
}

export async function getServiceResource(orgId: string, id: string) {
  const resource = await prisma.serviceResource.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      isActive: true,
      orgMemberId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!resource) {
    throw notFound();
  }

  return { resource };
}

export async function createServiceResource(orgId: string, input: ServiceResourceCreateInput) {
  if (typeof input.orgMemberId === "string") {
    await ensureOrgMember(orgId, input.orgMemberId);
  }

  try {
    const resource = await prisma.serviceResource.create({
      data: {
        org: { connect: { id: orgId } },
        displayName: input.displayName,
        email: input.email ?? null,
        phone: input.phone ?? null,
        orgMember: input.orgMemberId ? { connect: { id: input.orgMemberId } } : undefined,
        isActive: input.isActive ?? true,
      },
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        isActive: true,
        orgMemberId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { resource };
  } catch (err) {
    if (isUniqueConstraintError(err, "orgMemberId")) {
      throw orgMemberTaken();
    }
    throw err;
  }
}

export async function updateServiceResource(
  orgId: string,
  id: string,
  input: ServiceResourceUpdateInput,
) {
  if (typeof input.orgMemberId === "string") {
    await ensureOrgMember(orgId, input.orgMemberId);
  }

  const existing = await prisma.serviceResource.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw notFound();
  }

  const data: Prisma.ServiceResourceUpdateInput = {};

  if (input.displayName !== undefined) data.displayName = input.displayName;
  if (input.email !== undefined) data.email = input.email;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.orgMemberId !== undefined) {
    data.orgMember =
      input.orgMemberId === null ? { disconnect: true } : { connect: { id: input.orgMemberId } };
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;

  try {
    const resource = await prisma.serviceResource.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        displayName: true,
        email: true,
        phone: true,
        isActive: true,
        orgMemberId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { resource };
  } catch (err) {
    if (isUniqueConstraintError(err, "orgMemberId")) {
      throw orgMemberTaken();
    }
    throw err;
  }
}

export async function deleteServiceResource(orgId: string, id: string) {
  const result = await prisma.serviceResource.deleteMany({
    where: { id, orgId },
  });

  if (result.count === 0) {
    throw notFound();
  }

  return { deleted: true };
}
