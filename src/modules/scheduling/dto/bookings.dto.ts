import { z } from "../../../shared/zod.js";

export const BookingIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type BookingIdParams = z.infer<typeof BookingIdParamsSchema>;

export const BookingCreateSchema = z.object({
  workOrderId: z.string().trim().min(1).optional(),
  crewId: z.string().trim().min(1),
  statusId: z.string().trim().min(1).optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  requirements: z
    .array(
      z.object({
        resourceType: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1).optional(),
        notes: z.string().trim().min(1).optional(),
      }),
    )
    .optional(),
});

export type BookingCreateInput = z.infer<typeof BookingCreateSchema>;

export const BookingUpdateSchema = z.object({
  crewId: z.string().trim().min(1).optional(),
  scheduledStart: z.string().datetime().nullable().optional(),
  scheduledEnd: z.string().datetime().nullable().optional(),
});

export type BookingUpdateInput = z.infer<typeof BookingUpdateSchema>;

export const BookingStatusChangeSchema = z.object({
  statusId: z.string().trim().min(1),
});

export type BookingStatusChangeInput = z.infer<typeof BookingStatusChangeSchema>;
