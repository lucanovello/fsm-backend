import { prisma } from "../../infrastructure/db/prisma.js";
import { hasSystemRole } from "../../modules/rbac/rbac.service.js";
import { AppError } from "../../shared/errors.js";

import type { SystemRoleKey } from "../../modules/rbac/rbac.constants.js";
import type { RequestHandler } from "express";

const unauthorized = () => new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
const forbidden = () => new AppError("Forbidden", 403, { code: "FORBIDDEN" });
const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export const requireRole =
  (...roles: SystemRoleKey[]): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(unauthorized());
      }

      if (!req.org) {
        return next(orgRequired());
      }

      for (const roleKey of roles) {
        const allowed = await hasSystemRole(prisma, {
          orgId: req.org.id,
          memberId: req.org.membershipId,
          roleKey,
        });

        if (allowed) {
          return next();
        }
      }

      return next(forbidden());
    } catch (err) {
      return next(err);
    }
  };
