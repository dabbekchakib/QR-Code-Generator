import { z } from "zod";

const EMAIL_MIN = 5;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;
const NAME_MIN = 1;
const NAME_MAX = 80;

export const emailSchema = z
  .string()
  .trim()
  .min(EMAIL_MIN, "auth.errors.emailInvalid")
  .max(EMAIL_MAX, "auth.errors.emailInvalid")
  .email("auth.errors.emailInvalid");

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, "auth.errors.passwordTooShort")
  .max(PASSWORD_MAX, "auth.errors.passwordTooShort");

export const displayNameSchema = z
  .string()
  .trim()
  .min(NAME_MIN, "auth.errors.nameRequired")
  .max(NAME_MAX, "auth.errors.nameTooLong");

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordsMismatch",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "auth.errors.passwordsMismatch",
    path: ["confirmPassword"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;