import { z } from "../../../shared/zod.js";

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
