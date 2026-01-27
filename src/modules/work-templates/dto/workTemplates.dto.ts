import { z } from "../../../shared/zod.js";

export const WorkTemplatesListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type WorkTemplatesListQuery = z.infer<typeof WorkTemplatesListQuerySchema>;

export const WorkTemplateIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type WorkTemplateIdParams = z.infer<typeof WorkTemplateIdParamsSchema>;

export const WorkTemplateTaskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type WorkTemplateTaskInput = z.infer<typeof WorkTemplateTaskInputSchema>;

export const WorkTemplateSkillRequirementInputSchema = z.object({
  skillId: z.string().trim().min(1),
  quantity: z.coerce.number().int().min(1).optional(),
  notes: z.string().trim().min(1).optional(),
});

export type WorkTemplateSkillRequirementInput = z.infer<
  typeof WorkTemplateSkillRequirementInputSchema
>;

export const WorkTemplateCreateSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).optional(),
  isActive: z.boolean().optional(),
  tasks: z.array(WorkTemplateTaskInputSchema).optional(),
  skillRequirements: z.array(WorkTemplateSkillRequirementInputSchema).optional(),
});

export type WorkTemplateCreateInput = z.infer<typeof WorkTemplateCreateSchema>;

export const WorkTemplateUpdateSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: z.string().trim().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  tasks: z.array(WorkTemplateTaskInputSchema).optional(),
  skillRequirements: z.array(WorkTemplateSkillRequirementInputSchema).optional(),
});

export type WorkTemplateUpdateInput = z.infer<typeof WorkTemplateUpdateSchema>;
