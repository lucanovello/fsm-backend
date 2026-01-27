import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  CrewCreateInput,
  CrewMemberCreateInput,
  CrewsListQuery,
  CrewUpdateInput,
} from "./dto/crews.dto.js";

const crewNotFound = () => new AppError("Crew not found", 404, { code: "CREW_NOT_FOUND" });
const resourceNotFound = () =>
  new AppError("Service resource not found", 404, { code: "SERVICE_RESOURCE_NOT_FOUND" });
const crewNameTaken = () => new AppError("Crew name unavailable", 409, { code: "CREW_NAME_TAKEN" });
const crewMemberNotFound = () =>
  new AppError("Crew member not found", 404, { code: "CREW_MEMBER_NOT_FOUND" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

export async function listCrews(orgId: string, query: CrewsListQuery) {
  const { page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const [total, items] = await Promise.all([
    prisma.crew.count({ where: { orgId } }),
    prisma.crew.findMany({
      where: { orgId },
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  const shaped = items.map((crew) => ({
    id: crew.id,
    name: crew.name,
    description: crew.description,
    memberCount: crew._count.members,
  }));

  return { items: shaped, page, pageSize, total };
}

export async function getCrewDetail(orgId: string, id: string) {
  const crew = await prisma.crew.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      name: true,
      description: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          resource: {
            select: {
              id: true,
              displayName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!crew) {
    throw crewNotFound();
  }

  return {
    crew: {
      id: crew.id,
      name: crew.name,
      description: crew.description,
      createdAt: crew.createdAt,
      updatedAt: crew.updatedAt,
      members: crew.members.map((member) => ({
        id: member.id,
        resource: member.resource,
      })),
    },
  };
}

export async function createCrew(orgId: string, input: CrewCreateInput) {
  try {
    const crew = await prisma.crew.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { crew };
  } catch (err) {
    if (isUniqueConstraintError(err, "orgId")) {
      throw crewNameTaken();
    }
    if (isUniqueConstraintError(err, "name")) {
      throw crewNameTaken();
    }
    throw err;
  }
}

export async function updateCrew(orgId: string, id: string, input: CrewUpdateInput) {
  const existing = await prisma.crew.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw crewNotFound();
  }

  const data: Prisma.CrewUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;

  try {
    const crew = await prisma.crew.update({
      where: { id: existing.id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { crew };
  } catch (err) {
    if (isUniqueConstraintError(err, "orgId")) {
      throw crewNameTaken();
    }
    if (isUniqueConstraintError(err, "name")) {
      throw crewNameTaken();
    }
    throw err;
  }
}

export async function deleteCrew(orgId: string, id: string) {
  const result = await prisma.crew.deleteMany({
    where: { id, orgId },
  });

  if (result.count === 0) {
    throw crewNotFound();
  }

  return { deleted: true };
}

export async function addCrewMember(orgId: string, crewId: string, input: CrewMemberCreateInput) {
  const crew = await prisma.crew.findFirst({
    where: { id: crewId, orgId },
    select: { id: true },
  });

  if (!crew) {
    throw crewNotFound();
  }

  const resource = await prisma.serviceResource.findFirst({
    where: { id: input.resourceId, orgId },
    select: { id: true },
  });

  if (!resource) {
    throw resourceNotFound();
  }

  const member = await prisma.crewMember.upsert({
    where: {
      orgId_crewId_resourceId: {
        orgId,
        crewId,
        resourceId: input.resourceId,
      },
    },
    update: {},
    create: {
      orgId,
      crewId,
      resourceId: input.resourceId,
    },
    select: {
      id: true,
      crewId: true,
      resource: {
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          isActive: true,
        },
      },
    },
  });

  return { member };
}

export async function removeCrewMember(orgId: string, crewId: string, resourceId: string) {
  const result = await prisma.crewMember.deleteMany({
    where: { orgId, crewId, resourceId },
  });

  if (result.count === 0) {
    throw crewMemberNotFound();
  }

  return { deleted: true };
}
