import { z } from "../../../shared/zod.js";

export const CustomersListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type CustomersListQuery = z.infer<typeof CustomersListQuerySchema>;

export const CustomerIdParamsSchema = z.object({
  id: z.string().min(1),
});
export type CustomerIdParams = z.infer<typeof CustomerIdParamsSchema>;
