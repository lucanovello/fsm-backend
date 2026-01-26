import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type { CreateOrganizationInput } from "./dto/organizations.dto.js";

export type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  role: "OWNER" | "MEMBER";
};

const slugBase = (name: string): string => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "org";
};

const isUniqueConstraintError = (err: unknown, field: string): boolean => {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (err.code !== "P2002") return false;
  const target = err.meta?.target;
  if (!target) return false;
  if (Array.isArray(target)) return target.includes(field);
  return String(target).includes(field);
};

export async function listOrganizations(userId: string) {
  const memberships = await prisma.orgMember.findMany({
    where: { userId },
    select: {
      role: true,
      org: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { org: { name: "asc" } },
  });

  const items: OrganizationListItem[] = memberships.map((membership) => ({
    id: membership.org.id,
    name: membership.org.name,
    slug: membership.org.slug,
    role: membership.role,
  }));

  return { items, count: items.length };
}

export async function createOrganization(userId: string, input: CreateOrganizationInput) {
  const base = slugBase(input.name);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const slug = attempt === 0 ? base : `${base}-${randomUUID().replace(/-/g, "").slice(0, 8)}`;

    try {
      const org = await prisma.organization.create({
        data: {
          name: input.name,
          slug,
          members: {
            create: {
              userId,
              role: "OWNER",
            },
          },
        },
        select: { id: true, name: true, slug: true },
      });

      return {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          role: "OWNER" as const,
        },
      };
    } catch (err) {
      if (isUniqueConstraintError(err, "slug")) {
        continue;
      }
      throw err;
    }
  }

  throw new AppError("Organization slug unavailable", 409, { code: "ORG_SLUG_TAKEN" });
}
