import { z } from "../../../shared/zod.js";

export const CrewsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type CrewsListQuery = z.infer<typeof CrewsListQuerySchema>;

export const CrewIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type CrewIdParams = z.infer<typeof CrewIdParamsSchema>;

export const CrewCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(500).optional(),
});

export type CrewCreateInput = z.infer<typeof CrewCreateSchema>;

export const CrewUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).max(500).nullable().optional(),
});

export type CrewUpdateInput = z.infer<typeof CrewUpdateSchema>;

export const CrewMemberCreateSchema = z.object({
  resourceId: z.string().min(1),
});

export type CrewMemberCreateInput = z.infer<typeof CrewMemberCreateSchema>;

export const CrewMemberParamsSchema = z.object({
  id: z.string().min(1),
  resourceId: z.string().min(1),
});

export type CrewMemberParams = z.infer<typeof CrewMemberParamsSchema>;
