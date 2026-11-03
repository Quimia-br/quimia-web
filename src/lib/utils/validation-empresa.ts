import { z } from "zod";
import { emailSchema, textSchema } from "./validation";
import type { UpdateEmpresa } from "@/types/Empresa";

export const updateEmpresaSchema = z.object({
  nome: textSchema(255, 2).optional(),
  email: emailSchema.optional(),
  fotoUrl: z
    .string()
    .trim()
    .max(200)
    .pipe(z.url({ protocol: /^https$/ }))
    .optional(),
});
export const profileEditorSchema = updateEmpresaSchema.pick({ nome: true, email: true }).required();

export function validateUpdateEmpresa(input: UpdateEmpresa): UpdateEmpresa {
  return updateEmpresaSchema.parse(input);
}
