import { z } from "../../../shared/zod.js";

export const TechniciansListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(100),
});

export type TechniciansListQuery = z.infer<typeof TechniciansListQuerySchema>;
