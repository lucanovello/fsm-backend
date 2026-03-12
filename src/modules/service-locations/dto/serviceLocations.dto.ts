import { z } from "../../../shared/zod.js";

export const ServiceLocationsListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  customerId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ServiceLocationsListQuery = z.infer<typeof ServiceLocationsListQuerySchema>;

export const ServiceLocationIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type ServiceLocationIdParams = z.infer<typeof ServiceLocationIdParamsSchema>;

export const ServiceLocationCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  label: z.string().trim().min(1).max(160).optional(),
  addressLine1: z.string().trim().min(1).max(255),
  addressLine2: z.string().trim().min(1).max(255).optional(),
  city: z.string().trim().min(1).max(120),
  province: z.string().trim().min(1).max(120).optional(),
  postalCode: z.string().trim().min(1).max(40).optional(),
  country: z.string().trim().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type ServiceLocationCreateInput = z.infer<typeof ServiceLocationCreateSchema>;

export const ServiceLocationUpdateSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1).max(160).nullable().optional(),
  addressLine1: z.string().trim().min(1).max(255).optional(),
  addressLine2: z.string().trim().min(1).max(255).nullable().optional(),
  city: z.string().trim().min(1).max(120).optional(),
  province: z.string().trim().min(1).max(120).nullable().optional(),
  postalCode: z.string().trim().min(1).max(40).nullable().optional(),
  country: z.string().trim().min(1).max(120).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
});

export type ServiceLocationUpdateInput = z.infer<typeof ServiceLocationUpdateSchema>;
