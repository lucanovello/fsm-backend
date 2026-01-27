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

export const TaskStatusSchema = z.enum(["TODO", "DONE", "SKIPPED"]);

export const WorkOrderIncidentCreateSchema = z.object({
  templateId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type WorkOrderIncidentCreateInput = z.infer<typeof WorkOrderIncidentCreateSchema>;

export const WorkOrderIncidentParamsSchema = z.object({
  id: z.string().min(1),
  incidentId: z.string().min(1),
});

export type WorkOrderIncidentParams = z.infer<typeof WorkOrderIncidentParamsSchema>;

export const WorkOrderTaskInstantiateSchema = z.object({
  templateId: z.string().trim().min(1).optional(),
});

export type WorkOrderTaskInstantiateInput = z.infer<typeof WorkOrderTaskInstantiateSchema>;

export const WorkOrderTaskStatusUpdateSchema = z.object({
  status: TaskStatusSchema,
});

export type WorkOrderTaskStatusUpdateInput = z.infer<typeof WorkOrderTaskStatusUpdateSchema>;

export const WorkOrderTaskParamsSchema = z.object({
  id: z.string().min(1),
  taskId: z.string().min(1),
});

export type WorkOrderTaskParams = z.infer<typeof WorkOrderTaskParamsSchema>;
