import { z } from "../../../shared/zod.js";

export const ServiceContractsListQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export type ServiceContractsListQuery = z.infer<typeof ServiceContractsListQuerySchema>;

export const ServiceContractIdParamsSchema = z.object({
  id: z.string().min(1),
});

export type ServiceContractIdParams = z.infer<typeof ServiceContractIdParamsSchema>;

export const RecurrenceRuleInputSchema = z.object({
  rrule: z.string().trim().min(1),
  dtstartLocal: z.string().trim().min(1),
  timeZone: z.string().trim().min(1),
  untilLocal: z.string().trim().min(1).nullable().optional(),
});

export type RecurrenceRuleInput = z.infer<typeof RecurrenceRuleInputSchema>;

export const ContractItemInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(1000).nullable().optional(),
  quantity: z.coerce.number().int().min(1).default(1),
  unitPriceCents: z.coerce.number().int().min(0).nullable().optional(),
  workTemplateId: z.string().trim().min(1).nullable().optional(),
});

export type ContractItemInput = z.infer<typeof ContractItemInputSchema>;

export const ServiceContractCreateSchema = z.object({
  customerId: z.string().trim().min(1),
  serviceLocationId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  recurrence: RecurrenceRuleInputSchema,
  items: z.array(ContractItemInputSchema).optional(),
});

export type ServiceContractCreateInput = z.infer<typeof ServiceContractCreateSchema>;

export const ServiceContractUpdateSchema = z.object({
  customerId: z.string().trim().min(1).optional(),
  serviceLocationId: z.string().trim().min(1).nullable().optional(),
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  recurrence: RecurrenceRuleInputSchema.optional(),
  items: z.array(ContractItemInputSchema).optional(),
});

export type ServiceContractUpdateInput = z.infer<typeof ServiceContractUpdateSchema>;

export const ServiceContractMaterializeSchema = z.object({
  count: z.coerce.number().int().min(1).max(365).default(10),
});

export type ServiceContractMaterializeInput = z.infer<typeof ServiceContractMaterializeSchema>;
