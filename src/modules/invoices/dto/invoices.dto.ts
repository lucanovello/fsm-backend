import { z } from "../../../shared/zod.js";

export const InvoiceStatusSchema = z.enum(["DRAFT", "ISSUED", "PAID", "VOID"]);

export const InvoiceIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type InvoiceIdParams = z.infer<typeof InvoiceIdParamsSchema>;

export const InvoiceWorkOrderIdParamsSchema = z.object({
  id: z.string().min(1),
  workOrderId: z.string().min(1),
});

export type InvoiceWorkOrderIdParams = z.infer<typeof InvoiceWorkOrderIdParamsSchema>;

export const InvoiceLineIdParamsSchema = z.object({
  id: z.string().min(1),
  lineId: z.string().min(1),
});

export type InvoiceLineIdParams = z.infer<typeof InvoiceLineIdParamsSchema>;

export const InvoiceLineInputSchema = z.object({
  description: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPriceCents: z.coerce.number().int().min(0).nullable().optional(),
});

export type InvoiceLineInput = z.infer<typeof InvoiceLineInputSchema>;

export const InvoiceLineUpdateSchema = z.object({
  description: z.string().trim().min(1).max(200).optional(),
  quantity: z.coerce.number().int().min(1).optional(),
  unitPriceCents: z.coerce.number().int().min(0).nullable().optional(),
});

export type InvoiceLineUpdateInput = z.infer<typeof InvoiceLineUpdateSchema>;

export const InvoiceCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  dueDate: z.string().datetime().nullable().optional(),
  memo: z.string().trim().max(2000).nullable().optional(),
  workOrderIds: z.array(z.string().trim().min(1)).min(1).optional(),
  lines: z.array(InvoiceLineInputSchema).optional(),
});

export type InvoiceCreateInput = z.infer<typeof InvoiceCreateSchema>;

export const InvoiceWorkOrdersAddSchema = z.object({
  workOrderIds: z.array(z.string().trim().min(1)).min(1),
});

export type InvoiceWorkOrdersAddInput = z.infer<typeof InvoiceWorkOrdersAddSchema>;

export const InvoiceStatusUpdateSchema = z.object({
  status: InvoiceStatusSchema,
});

export type InvoiceStatusUpdateInput = z.infer<typeof InvoiceStatusUpdateSchema>;
