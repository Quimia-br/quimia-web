import { z } from "zod";
import { concentrationUnitSchema } from "@/lib/fds-analysis";
import { PRODUCT_SEARCH_FIELDS } from "@/types/Produto";
import type { AlteracaoProdutoForm, CadastroProdutoForm, ProdutoSearch } from "@/types/Produto";
import { imageFileSchema, pdfFileSchema } from "./validation-files";
import { positiveIdSchema, textSchema } from "./validation";

export const analysisIdSchema = textSchema(262144, 1);
const correctionsSchema = z.array(z.object({ indice: z.number().int().nonnegative(), unidadeConcentracao: concentrationUnitSchema }))
  .refine((value) => JSON.stringify(value).length <= 4000, "As correções excedem o limite de 4000 caracteres.");
const fields = {
  nome: textSchema(255), tipo: textSchema(50), descricao: textSchema(4000, 0, true).optional(),
  codBarras: textSchema(255).optional(), imagem: imageFileSchema.optional(), fds: pdfFileSchema.optional(),
  analiseFds: analysisIdSchema.optional(), correcoesFds: correctionsSchema.optional(),
};
function validFdsSource(value: { fds?: File; analiseFds?: string }): boolean { return !(value.fds && value.analiseFds); }
export const createProdutoSchema = z.object({ ...fields, nome: textSchema(255, 2), tipo: textSchema(50, 1) })
  .refine(validFdsSource, { message: "Envie o PDF ou a análise revisada, um de cada vez.", path: ["fds"] });
export const updateProdutoSchema = z.object(fields).partial()
  .refine(validFdsSource, { message: "Envie o PDF ou a análise revisada, um de cada vez.", path: ["fds"] });
export const produtoSearchSchema = z.object({
  query: textSchema(255).optional(), fields: z.array(z.enum(PRODUCT_SEARCH_FIELDS)).readonly().optional(),
  tipo: textSchema(50).optional(), codBarras: textSchema(255).optional(),
  page: z.number().int().nonnegative().max(2147483647).optional(), size: z.number().int().min(1).max(50).optional(),
});
export function validateCreateProduto(input: CadastroProdutoForm): CadastroProdutoForm { return createProdutoSchema.parse(input); }
export function validateUpdateProduto(input: AlteracaoProdutoForm): AlteracaoProdutoForm { return updateProdutoSchema.parse(input); }
export function validateProdutoSearch(input: ProdutoSearch): ProdutoSearch { return produtoSearchSchema.parse(input); }
export function validateProductId(id: number): number { return positiveIdSchema.parse(id); }
