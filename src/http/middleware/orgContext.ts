import { prisma } from "../../infrastructure/db/prisma.js";
import { AppError } from "../../shared/errors.js";

import type { RequestHandler } from "express";

const ORG_HEADER = "x-org-id";

type OrgContextOptions = {
  required?: boolean;
};

const forbidden = () => new AppError("Forbidden", 403, { code: "ORG_FORBIDDEN" });
const required = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export const resolveOrgContext = (options: OrgContextOptions = {}): RequestHandler => {
  const { required: requireOrg = false } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next();
      }

      const header = req.get(ORG_HEADER) ?? "";
      const orgId = header.trim();

      if (orgId) {
        const membership = await prisma.orgMember.findUnique({
          where: {
            orgId_userId: {
              orgId,
              userId: req.user.id,
            },
          },
          select: { id: true, orgId: true, role: true },
        });

        if (!membership) {
          throw forbidden();
        }

        req.org = {
          id: membership.orgId,
          membershipId: membership.id,
          role: membership.role,
        };
        res.locals.orgId = membership.orgId;

        return next();
      }

      if (!requireOrg) {
        return next();
      }

      const memberships = await prisma.orgMember.findMany({
        where: { userId: req.user.id },
        select: { id: true, orgId: true, role: true },
        orderBy: { createdAt: "asc" },
        take: 2,
      });

      if (memberships.length === 1) {
        const membership = memberships[0];
        req.org = {
          id: membership.orgId,
          membershipId: membership.id,
          role: membership.role,
        };
        res.locals.orgId = membership.orgId;
        return next();
      }

      throw required();
    } catch (err) {
      return next(err);
    }
  };
};
