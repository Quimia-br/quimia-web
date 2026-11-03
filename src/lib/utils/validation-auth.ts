import { z } from "zod";
import { emailSchema, textSchema } from "./validation";
import type { LoginCredentials, RegisterRequest, ResetPasswordData } from "@/types/AuthState";

export const AUTH_FIELD_LIMITS = { email: 255, nome: 255, cnpj: 20, password: 72 } as const;

const weakPasswords = new Set([
  "senha123",
  "senha1234",
  "password1",
  "password123",
  "12345678a",
  "a12345678",
  "quimia123",
  "qwerty123",
  "abc12345",
]);
// Passwords are credentials: never trim, normalize Unicode, or remove characters.
export const loginPasswordSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Informe a senha.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "A senha deve ter no máximo 72 bytes.",
  );
export const newPasswordSchema = loginPasswordSchema
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .refine(
    (value) =>
      /\p{L}/u.test(value) && /\p{Nd}/u.test(value) && !weakPasswords.has(value.toLowerCase()),
    "Use uma senha com letra e número que não seja comum.",
  );

export function isValidCnpj(value: string): boolean {
  const normalized = value.replace(/[.\-/\s]/g, "").toUpperCase();
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(normalized) || /^(.)\1{13}$/.test(normalized)) return false;
  const digit = (weights: number[]): number => {
    const remainder =
      weights.reduce(
        (sum, weight, index) => sum + (normalized.charCodeAt(index) - 48) * weight,
        0,
      ) % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return (
    Number(normalized[12]) === digit([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) &&
    Number(normalized[13]) === digit([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  );
}
export const cnpjSchema = textSchema(20, 1)
  .transform((value) => value.toUpperCase())
  .refine(isValidCnpj, "Informe um CNPJ válido.");
export const loginSchema = z.object({ email: emailSchema, senha: loginPasswordSchema });
export const registerSchema = loginSchema.extend({
  nome: textSchema(255, 2),
  cnpj: cnpjSchema,
  senha: newPasswordSchema,
});
export const resetPasswordSchema = z.object({
  resetToken: textSchema(2048, 1),
  novaSenha: newPasswordSchema,
});
export function validateLogin(input: LoginCredentials): LoginCredentials {
  return loginSchema.parse(input);
}
export function validateRegister(input: RegisterRequest): RegisterRequest {
  return registerSchema.parse(input);
}
export function validateResetPassword(input: ResetPasswordData): ResetPasswordData {
  return resetPasswordSchema.parse(input);
}
