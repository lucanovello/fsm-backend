import { z } from "../../../shared/zod.js";

export const BookingStatusIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type BookingStatusIdParams = z.infer<typeof BookingStatusIdParamsSchema>;

export const BookingStatusesListQuerySchema = z.object({
  includeInactive: z.coerce.boolean().default(false),
});

export type BookingStatusesListQuery = z.infer<typeof BookingStatusesListQuerySchema>;

export const BookingStatusCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type BookingStatusCreateInput = z.infer<typeof BookingStatusCreateSchema>;

export const BookingStatusUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().min(1).max(500).nullable().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type BookingStatusUpdateInput = z.infer<typeof BookingStatusUpdateSchema>;
