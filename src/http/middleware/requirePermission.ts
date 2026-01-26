import { prisma } from "../../infrastructure/db/prisma.js";
import { hasPermission } from "../../modules/rbac/rbac.service.js";
import { AppError } from "../../shared/errors.js";

import type { RequestHandler } from "express";

const unauthorized = () => new AppError("Unauthorized", 401, { code: "UNAUTHORIZED" });
const forbidden = () => new AppError("Forbidden", 403, { code: "FORBIDDEN" });
const orgRequired = () => new AppError("Organization required", 400, { code: "ORG_REQUIRED" });

export const requirePermission =
  (key: string): RequestHandler =>
  async (req, _res, next) => {
    try {
      if (!req.user) {
        return next(unauthorized());
      }

      if (!req.org) {
        return next(orgRequired());
      }

      const allowed = await hasPermission(prisma, {
        orgId: req.org.id,
        memberId: req.org.membershipId,
        key,
      });

      if (!allowed) {
        return next(forbidden());
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
