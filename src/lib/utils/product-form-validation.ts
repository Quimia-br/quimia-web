import { z } from "zod";
import { textSchema } from "./validation";

export const productCreateFormSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),
  tipo: z
    .string()
    .trim()
    .min(1, "Informe o tipo do produto.")
    .max(50, "O tipo deve ter no máximo 50 caracteres."),
  descricao: z.string().max(4000, "A descrição deve ter no máximo 4.000 caracteres.").trim(),
  codBarras: z
    .string()
    .max(255, "O código de barras deve ter no máximo 255 dígitos.")
    // The API removes only ASCII spaces; tabs and other control characters are invalid.
    .transform((value) => value.replace(/^ +| +$/g, ""))
    .refine((value) => /^[0-9]*$/.test(value), "Use apenas dígitos no código de barras."),
});

export const productActionFormSchema = z.object({
  nome: textSchema(255, 2),
  tipo: textSchema(50, 1),
  descricao: textSchema(4000, 0, true),
  codBarras: textSchema(255).refine(
    (value) => /^\d*$/.test(value),
    "Use apenas dígitos no código de barras.",
  ),
});

function readSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsText(file.slice(0, 5));
  });
}
export async function validateFdsFile(next: File) {
  if (next.size > 10 * 1024 * 1024) throw new Error("O PDF deve ter no máximo 10 MB.");
  if (
    !next.size ||
    !next.name.toLowerCase().endsWith(".pdf") ||
    (await readSignature(next)) !== "%PDF-"
  )
    throw new Error("Escolha um PDF válido da Ficha de Dados de Segurança.");
}
