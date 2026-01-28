import { z } from "zod";

export const QuickBooksCallbackQuerySchema = z.object({
  code: z.string().min(1),
  realmId: z.string().min(1),
  state: z.string().min(1),
});

export const QuickBooksConnectResponseSchema = z.object({
  url: z.string().url(),
  connectionId: z.string(),
  stateExpiresAt: z.string().datetime(),
});

export const QuickBooksCallbackResponseSchema = z.object({
  status: z.literal("connected"),
  connectionId: z.string(),
  realmId: z.string(),
});

export const QuickBooksWebhookSchema = z
  .object({
    eventNotifications: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type QuickBooksCallbackQuery = z.infer<typeof QuickBooksCallbackQuerySchema>;
export type QuickBooksConnectResponse = z.infer<typeof QuickBooksConnectResponseSchema>;
export type QuickBooksCallbackResponse = z.infer<typeof QuickBooksCallbackResponseSchema>;
