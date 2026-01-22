import { z } from "../../../shared/zod.js";

export const WorkOrdersListQuerySchema = z.object({
  date: z.string().trim().optional(),
  status: z.string().trim().optional(),
  technicianId: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type WorkOrdersListQuery = z.infer<typeof WorkOrdersListQuerySchema>;

export const WorkOrderIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type WorkOrderIdParams = z.infer<typeof WorkOrderIdParamsSchema>;
