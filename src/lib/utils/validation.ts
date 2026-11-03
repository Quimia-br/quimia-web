import { z } from "zod";

// Reject control characters instead of silently changing meaningful user text.
export function hasControlCharacters(value: string, multiline = false): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return (
      (code < 32 && !(multiline && [9, 10, 13].includes(code))) || (code >= 127 && code <= 159)
    );
  });
}

export function textSchema(max: number, min = 0, multiline = false) {
  return z
    .string()
    .trim()
    .min(min, `Informe pelo menos ${min} caracteres.`)
    .max(max, `Use no máximo ${max} caracteres.`)
    .refine(
      (value) => !hasControlCharacters(value, multiline),
      "Remova os caracteres de controle.",
    );
}

export const positiveIdSchema = z.number().int().positive().max(2147483647);
export const emailSchema = z
  .string()
  .trim()
  .max(255, "O e-mail deve ter no máximo 255 caracteres.")
  .pipe(z.email("Informe um e-mail válido."))
  .transform((value) => value.toLowerCase());
