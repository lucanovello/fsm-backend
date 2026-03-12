import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  ResourceSkillsReplaceInput,
  SkillCreateInput,
  SkillsListQuery,
  SkillUpdateInput,
} from "./dto/skills.dto.js";

const skillNotFound = () => new AppError("Skill not found", 404, { code: "SKILL_NOT_FOUND" });

const skillNameTaken = () =>
  new AppError("Skill name already exists", 409, { code: "SKILL_NAME_TAKEN" });

const skillInUse = () => new AppError("Skill is in use", 409, { code: "SKILL_IN_USE" });

const serviceResourceNotFound = () =>
  new AppError("Service resource not found", 404, { code: "SERVICE_RESOURCE_NOT_FOUND" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const isForeignKeyConstraintError = (err: unknown): boolean =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003";

const ensureServiceResource = async (orgId: string, resourceId: string) => {
  const resource = await prisma.serviceResource.findFirst({
    where: { id: resourceId, orgId },
    select: { id: true },
  });
  if (!resource) {
    throw serviceResourceNotFound();
  }
};

const ensureSkillsExist = async (orgId: string, skillIds: string[]) => {
  if (skillIds.length === 0) return;
  const uniqueIds = Array.from(new Set(skillIds));
  const count = await prisma.skill.count({ where: { orgId, id: { in: uniqueIds } } });
  if (count !== uniqueIds.length) {
    throw skillNotFound();
  }
};

export async function listSkills(orgId: string, query: SkillsListQuery) {
  const { q, page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SkillWhereInput = { orgId };
  if (q) {
    where.OR = [
      { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
      { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.skill.count({ where }),
    prisma.skill.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { resources: true } },
      },
    }),
  ]);

  return {
    items: items.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      resourceCount: skill._count.resources,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
    })),
    page,
    pageSize,
    total,
  };
}

export async function getSkill(orgId: string, id: string) {
  const skill = await prisma.skill.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      resources: {
        select: {
          resourceId: true,
          resource: {
            select: { id: true, displayName: true, email: true, phone: true, isActive: true },
          },
        },
      },
    },
  });

  if (!skill) {
    throw skillNotFound();
  }

  return {
    skill: {
      id: skill.id,
      name: skill.name,
      description: skill.description,
      createdAt: skill.createdAt,
      updatedAt: skill.updatedAt,
      resources: skill.resources.map((item) => item.resource),
    },
  };
}

export async function createSkill(orgId: string, input: SkillCreateInput) {
  try {
    const skill = await prisma.skill.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
      },
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });

    return { skill };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw skillNameTaken();
    }
    throw err;
  }
}

export async function updateSkill(orgId: string, id: string, input: SkillUpdateInput) {
  const existing = await prisma.skill.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw skillNotFound();
  }

  const data: Prisma.SkillUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;

  try {
    const skill = await prisma.skill.update({
      where: { id: existing.id },
      data,
      select: { id: true, name: true, description: true, createdAt: true, updatedAt: true },
    });

    return { skill };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw skillNameTaken();
    }
    throw err;
  }
}

export async function deleteSkill(orgId: string, id: string) {
  try {
    const result = await prisma.skill.deleteMany({
      where: { id, orgId },
    });

    if (result.count === 0) {
      throw skillNotFound();
    }

    return { deleted: true };
  } catch (err) {
    if (isForeignKeyConstraintError(err)) {
      throw skillInUse();
    }
    throw err;
  }
}

export async function listResourceSkills(orgId: string, resourceId: string) {
  await ensureServiceResource(orgId, resourceId);

  const items = await prisma.resourceSkill.findMany({
    where: { orgId, resourceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      skillId: true,
      createdAt: true,
      skill: {
        select: { id: true, name: true, description: true },
      },
    },
  });

  return {
    resourceId,
    skills: items.map((item) => ({
      id: item.id,
      skillId: item.skillId,
      createdAt: item.createdAt,
      skill: item.skill,
    })),
  };
}

export async function replaceResourceSkills(
  orgId: string,
  resourceId: string,
  input: ResourceSkillsReplaceInput,
) {
  await ensureServiceResource(orgId, resourceId);

  const skillIds = Array.from(new Set(input.skillIds));
  await ensureSkillsExist(orgId, skillIds);

  await prisma.$transaction(async (tx) => {
    await tx.resourceSkill.deleteMany({
      where: { orgId, resourceId },
    });

    if (skillIds.length > 0) {
      await tx.resourceSkill.createMany({
        data: skillIds.map((skillId) => ({ orgId, resourceId, skillId })),
        skipDuplicates: true,
      });
    }
  });

  return listResourceSkills(orgId, resourceId);
}
