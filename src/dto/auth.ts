import { z } from "zod";

const passwordComplexityMessage =
  "Password must be at least 8 characters and include lowercase, uppercase, number, and symbol.";

const passwordSchema = z
  .string()
  .min(8, { error: passwordComplexityMessage })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/u, {
    error: passwordComplexityMessage,
  });

export const RegisterSchema = z.object({
  email: z.email(),
  password: passwordSchema,
});

export const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(20),
});

export const RequestPasswordResetSchema = z.object({
  email: z.email(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
