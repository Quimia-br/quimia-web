import { z } from "zod";

export const imageFileSchema = z.file().min(1, "Selecione uma imagem não vazia.")
  .max(5 * 1024 * 1024, "A imagem deve ter no máximo 5 MB.")
  .mime(["image/jpeg", "image/png", "image/webp"], "Use uma imagem JPEG, PNG ou WebP.");
export const pdfFileSchema = z.file().min(1, "Selecione um PDF não vazio.")
  .max(10 * 1024 * 1024, "O PDF deve ter no máximo 10 MB.")
  .refine((file) => file.type === "application/pdf" || (!file.type && file.name.toLowerCase().endsWith(".pdf")), "Use um arquivo PDF.");
export function validateImage(input: File): File { return imageFileSchema.parse(input); }
export function validatePdf(input: File): File { return pdfFileSchema.parse(input); }
