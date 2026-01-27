import { z } from "../../../shared/zod.js";

export const RouteIdParamsSchema = z.object({
  id: z.string().trim().min(1),
});

export type RouteIdParams = z.infer<typeof RouteIdParamsSchema>;

export const RouteStopIdParamsSchema = z.object({
  id: z.string().trim().min(1),
  stopId: z.string().trim().min(1),
});

export type RouteStopIdParams = z.infer<typeof RouteStopIdParamsSchema>;

export const RouteCreateSchema = z.object({
  crewId: z.string().trim().min(1),
  routeDate: z.string().datetime(),
});

export type RouteCreateInput = z.infer<typeof RouteCreateSchema>;

export const RouteStopAddSchema = z.object({
  bookingId: z.string().trim().min(1),
});

export type RouteStopAddInput = z.infer<typeof RouteStopAddSchema>;

export const RouteStopReorderSchema = z.object({
  stopIds: z.array(z.string().trim().min(1)).min(1),
});

export type RouteStopReorderInput = z.infer<typeof RouteStopReorderSchema>;
