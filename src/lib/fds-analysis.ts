import { z } from "zod";
import type { FdsAnalysis } from "@/types/Produto";

const compoundReference = z.object({
  indice: z.number().int().nonnegative(),
  nome: z.string(),
  casNumero: z.string().nullable(),
});
export const fdsAnalysisSchema: z.ZodType<FdsAnalysis> = z.object({
  analiseId: z.string().min(1).max(262144),
  expiraEm: z.iso.datetime({ offset: true }),
  status: z.enum(["processado", "processado_com_pendencias"]),
  mensagem: z.string().nullable(),
  pendencias: z.array(
    z.object({
      secao: z.string(),
      campo: z.string(),
      motivo: z.string(),
      descricao: z.string(),
      composto: compoundReference.nullable(),
      corrigivel: z.boolean(),
      evidencias: z.array(
        z.object({
          secao: z.string(),
          pagina: z.number().int().nullable(),
          textoEvidencia: z.string(),
        }),
      ),
    }),
  ),
  compostos: z.array(
    compoundReference.extend({
      concentracaoMin: z.number().nullable(),
      concentracaoMax: z.number().nullable(),
      unidadeConcentracao: z.string().nullable(),
    }),
  ),
});

export const concentrationUnitSchema = z
  .string()
  .trim()
  .min(1, "Informe a unidade de concentração.")
  .max(20, "A unidade deve ter no máximo 20 caracteres.")
  .refine(
    (value) =>
      !Array.from(value).some(
        (character) =>
          character.charCodeAt(0) < 32 ||
          (character.charCodeAt(0) >= 127 && character.charCodeAt(0) <= 159),
      ),
    "A unidade não pode conter caracteres de controle.",
  );
