import { z } from "../../../shared/zod.js";

export const SkillsListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type SkillsListQuery = z.infer<typeof SkillsListQuerySchema>;

export const SkillIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type SkillIdParams = z.infer<typeof SkillIdParamsSchema>;

export const SkillCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
});

export type SkillCreateInput = z.infer<typeof SkillCreateSchema>;

export const SkillUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(500).nullable().optional(),
});

export type SkillUpdateInput = z.infer<typeof SkillUpdateSchema>;

export const ResourceSkillsParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type ResourceSkillsParams = z.infer<typeof ResourceSkillsParamsSchema>;

export const ResourceSkillsReplaceSchema = z.object({
  skillIds: z.array(z.string().trim().min(1)).default([]),
});

export type ResourceSkillsReplaceInput = z.infer<typeof ResourceSkillsReplaceSchema>;
