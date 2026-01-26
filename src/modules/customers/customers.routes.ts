import { Router } from "express";

import { requirePermission } from "../../http/middleware/requirePermission.js";
import { validateRequest } from "../../http/middleware/validate.js";
import { PERMISSION_KEYS } from "../rbac/rbac.constants.js";

import { getCustomerDetailsHandler, listCustomersHandler } from "./customers.controller.js";
import { CustomerIdParamsSchema, CustomersListQuerySchema } from "./dto/customers.dto.js";

export const customersRoutes = Router();

customersRoutes.get(
  "/",
  requirePermission(PERMISSION_KEYS.customersRead),
  validateRequest({ query: CustomersListQuerySchema }),
  listCustomersHandler,
);

customersRoutes.get(
  "/:id",
  requirePermission(PERMISSION_KEYS.customersRead),
  validateRequest({ params: CustomerIdParamsSchema }),
  getCustomerDetailsHandler,
);
