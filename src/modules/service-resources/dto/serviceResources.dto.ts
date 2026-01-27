import { z } from "../../../shared/zod.js";

export const ServiceResourcesListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ServiceResourcesListQuery = z.infer<typeof ServiceResourcesListQuerySchema>;

export const ServiceResourceIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type ServiceResourceIdParams = z.infer<typeof ServiceResourceIdParamsSchema>;

export const ServiceResourceCreateSchema = z.object({
  displayName: z.string().trim().min(1).max(160),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  orgMemberId: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
});

export type ServiceResourceCreateInput = z.infer<typeof ServiceResourceCreateSchema>;

export const ServiceResourceUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().min(1).nullable().optional(),
  orgMemberId: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export type ServiceResourceUpdateInput = z.infer<typeof ServiceResourceUpdateSchema>;
