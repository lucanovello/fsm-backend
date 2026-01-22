import { getCustomerDetails, listCustomers } from "./customers.service.js";
import {
  CustomerIdParamsSchema,
  CustomersListQuerySchema,
  type CustomerIdParams,
} from "./dto/customers.dto.js";

import type { Request, Response, NextFunction } from "express";

export async function listCustomersHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const query = CustomersListQuerySchema.parse(req.query);
    const result = await listCustomers(query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getCustomerDetailsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    // validateRequest ensures shape; this is just for TS typing
    const { id } = req.params as CustomerIdParams;
    CustomerIdParamsSchema.parse(req.params);

    const result = await getCustomerDetails(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
