import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import { getCustomerDetailsHandler, listCustomersHandler } from "./customers.controller.js";
import { CustomerIdParamsSchema, CustomersListQuerySchema } from "./dto/customers.dto.js";

export const customersRoutes = Router();

customersRoutes.get(
  "/",
  validateRequest({ query: CustomersListQuerySchema }),
  listCustomersHandler,
);

customersRoutes.get(
  "/:id",
  validateRequest({ params: CustomerIdParamsSchema }),
  getCustomerDetailsHandler,
);
