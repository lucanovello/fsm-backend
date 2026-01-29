import { z } from "../../../shared/zod.js";

export const GeoDeviceCreateSchema = z.object({
  serviceResourceId: z.string().trim().min(1),
  deviceIdentifier: z.string().trim().min(1).max(128),
  label: z.string().trim().min(1).max(120).optional(),
  isActive: z.boolean().optional(),
});

export type GeoDeviceCreateInput = z.infer<typeof GeoDeviceCreateSchema>;

export const GeoPingIngestItemSchema = z.object({
  deviceId: z.string().trim().min(1),
  recordedAt: z.string().datetime(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().nonnegative().optional(),
  altitudeMeters: z.number().optional(),
  speedMps: z.number().nonnegative().optional(),
  headingDeg: z.number().min(0).max(360).optional(),
});

export const GeoPingBatchIngestSchema = z.object({
  pings: z.array(GeoPingIngestItemSchema).min(1).max(1000),
});

export type GeoPingBatchIngestInput = z.infer<typeof GeoPingBatchIngestSchema>;

export const GeoResourceIdParamsSchema = z.object({
  resourceId: z.string().trim().min(1),
});

export type GeoResourceIdParams = z.infer<typeof GeoResourceIdParamsSchema>;

export const GeoPingsQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(200),
});

export type GeoPingsQuery = z.infer<typeof GeoPingsQuerySchema>;
