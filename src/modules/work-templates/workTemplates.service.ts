import { Prisma } from "@prisma/client";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type {
  WorkTemplateCreateInput,
  WorkTemplateUpdateInput,
  WorkTemplatesListQuery,
  WorkTemplateSkillRequirementInput,
} from "./dto/workTemplates.dto.js";

const templateNotFound = () =>
  new AppError("Work template not found", 404, { code: "WORK_TEMPLATE_NOT_FOUND" });

const templateNameTaken = () =>
  new AppError("Work template name already exists", 409, {
    code: "WORK_TEMPLATE_NAME_TAKEN",
  });

const skillNotFound = () => new AppError("Skill not found", 404, { code: "SKILL_NOT_FOUND" });

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

const validateSkills = async (
  orgId: string,
  requirements?: WorkTemplateSkillRequirementInput[],
) => {
  if (!requirements || requirements.length === 0) return;

  const skillIds = Array.from(new Set(requirements.map((req) => req.skillId)));
  const count = await prisma.skill.count({
    where: { orgId, id: { in: skillIds } },
  });

  if (count !== skillIds.length) {
    throw skillNotFound();
  }
};

export async function listWorkTemplates(orgId: string, query: WorkTemplatesListQuery) {
  const { q, page, pageSize, isActive } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.WorkTemplateWhereInput = { orgId };
  if (q) {
    where.name = { contains: q, mode: Prisma.QueryMode.insensitive };
  }
  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [total, items] = await Promise.all([
    prisma.workTemplate.count({ where }),
    prisma.workTemplate.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { tasks: true } },
      },
    }),
  ]);

  return {
    items: items.map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      isActive: template.isActive,
      taskCount: template._count.tasks,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    })),
    page,
    pageSize,
    total,
  };
}

export async function getWorkTemplate(orgId: string, id: string) {
  const template = await prisma.workTemplate.findFirst({
    where: { id, orgId },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      tasks: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { id: true, title: true, description: true, sortOrder: true },
      },
      skillRequirements: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          skillId: true,
          quantity: true,
          notes: true,
          skill: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!template) {
    throw templateNotFound();
  }

  return { template };
}

export async function createWorkTemplate(orgId: string, input: WorkTemplateCreateInput) {
  await validateSkills(orgId, input.skillRequirements);

  const tasks = input.tasks?.map((task, index) => ({
    orgId,
    title: task.title,
    description: task.description ?? null,
    sortOrder: task.sortOrder ?? index,
  }));

  const requirements = input.skillRequirements?.map((req) => ({
    orgId,
    skillId: req.skillId,
    quantity: req.quantity ?? 1,
    notes: req.notes ?? null,
  }));

  try {
    const template = await prisma.workTemplate.create({
      data: {
        orgId,
        name: input.name,
        description: input.description ?? null,
        isActive: input.isActive ?? true,
        tasks: tasks && tasks.length > 0 ? { create: tasks } : undefined,
        skillRequirements:
          requirements && requirements.length > 0 ? { create: requirements } : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        tasks: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, title: true, description: true, sortOrder: true },
        },
        skillRequirements: {
          orderBy: [{ createdAt: "asc" }],
          select: {
            id: true,
            skillId: true,
            quantity: true,
            notes: true,
            skill: { select: { id: true, name: true } },
          },
        },
      },
    });

    return { template };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw templateNameTaken();
    }
    throw err;
  }
}

export async function updateWorkTemplate(
  orgId: string,
  id: string,
  input: WorkTemplateUpdateInput,
) {
  await validateSkills(orgId, input.skillRequirements);

  const existing = await prisma.workTemplate.findFirst({
    where: { id, orgId },
    select: { id: true },
  });

  if (!existing) {
    throw templateNotFound();
  }

  const data: Prisma.WorkTemplateUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const tasks = input.tasks?.map((task, index) => ({
    orgId,
    templateId: existing.id,
    title: task.title,
    description: task.description ?? null,
    sortOrder: task.sortOrder ?? index,
  }));

  const requirements = input.skillRequirements?.map((req) => ({
    orgId,
    templateId: existing.id,
    skillId: req.skillId,
    quantity: req.quantity ?? 1,
    notes: req.notes ?? null,
  }));

  try {
    const template = await prisma.$transaction(async (tx) => {
      if (input.tasks !== undefined) {
        await tx.templateTask.deleteMany({ where: { templateId: existing.id, orgId } });
        if (tasks && tasks.length > 0) {
          await tx.templateTask.createMany({ data: tasks });
        }
      }

      if (input.skillRequirements !== undefined) {
        await tx.templateSkillRequirement.deleteMany({
          where: { templateId: existing.id, orgId },
        });
        if (requirements && requirements.length > 0) {
          await tx.templateSkillRequirement.createMany({ data: requirements });
        }
      }

      return tx.workTemplate.update({
        where: { id: existing.id },
        data,
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          tasks: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: { id: true, title: true, description: true, sortOrder: true },
          },
          skillRequirements: {
            orderBy: [{ createdAt: "asc" }],
            select: {
              id: true,
              skillId: true,
              quantity: true,
              notes: true,
              skill: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    return { template };
  } catch (err) {
    if (isUniqueConstraintError(err, "name")) {
      throw templateNameTaken();
    }
    throw err;
  }
}

export async function deleteWorkTemplate(orgId: string, id: string) {
  const result = await prisma.workTemplate.deleteMany({ where: { id, orgId } });

  if (result.count === 0) {
    throw templateNotFound();
  }

  return { deleted: true };
}
