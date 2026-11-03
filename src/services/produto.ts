import { api } from "@/services/api";
import { z } from "zod";
import { AxiosError, CanceledError } from "axios";
import { normalizeServiceError, parseResponse } from "./errors";
import {
  analysisIdSchema,
  validateCreateProduto,
  validateUpdateProduto,
  validateProdutoSearch,
  validateProductId,
  validateProdutoFiles,
} from "@/utils/validation-produto";
import { validatePdf } from "@/utils/validation-files";
import { fdsAnalysisJobSchema } from "@/lib/fds-analysis";
import { useAuthStore } from "@/lib/auth-token";
import type { Pagina } from "@/types/Pagina";
import type {
  AlteracaoProdutoForm,
  CadastroProdutoForm,
  CadastroProdutoResponse,
  FdsAnalysis,
  Produto,
  ProdutoSearch,
} from "@/types/Produto";

const path = "/empresas/me/produtos";
const multipartConfig = { headers: { "Content-Type": "multipart/form-data" } };
const productSchema: z.ZodType<Produto> = z.object({
  id: z.number().int().positive().max(2147483647),
  nome: z.string(),
  tipo: z.string().nullable(),
  descricao: z.string().nullable(),
  codBarras: z.string().nullable(),
  fotoUrl: z.string().nullable(),
  marca: z.object({
    id: z.number().int().positive(),
    nome: z.string(),
    logoUrl: z.string().nullable(),
  }),
});
// Confirm the persisted product and outcome before the dialog can discard its draft.
const creationConfirmationSchema = z.object({
  produto: productSchema,
  situacao: z.enum(["criado", "vinculado", "reativado"]),
});
const productPageSchema = z.object({
  itens: z.array(productSchema),
  pagina: z.number().int().nonnegative(),
  tamanho: z.number().int().positive(),
  totalItens: z.number().int().nonnegative(),
  totalPaginas: z.number().int().nonnegative(),
});

export async function getTypes(signal?: AbortSignal): Promise<string[]> {
  try {
    const response = await api.get<unknown>(`${path}/tipos`, { signal });
    return parseResponse(response, z.array(z.string()), "invalid_product_types_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.getTypes");
  }
}

export async function getAll(
  search: ProdutoSearch = {},
  signal?: AbortSignal,
): Promise<Pagina<Produto>> {
  try {
    const { query, fields, ...filters } = validateProdutoSearch(search);
    const response = await api.get<unknown>(path, {
      params: { q: query, fields: fields?.join(","), ...filters },
      signal,
    });
    return parseResponse(response, productPageSchema, "invalid_product_list_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.getAll");
  }
}

export async function getById(id: number, signal?: AbortSignal): Promise<Produto> {
  try {
    const response = await api.get<unknown>(`/produtos/${validateProductId(id)}`, { signal });
    return parseResponse(response, productSchema, "invalid_product_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.getById");
  }
}

function toFormData(produto: AlteracaoProdutoForm): FormData {
  const form = new FormData();

  for (const field of ["nome", "tipo", "descricao", "codBarras"] as const) {
    const value = produto[field];
    if (value !== undefined) {
      form.append(field, value);
    }
  }

  if (produto.imagem) {
    form.append("imagem", produto.imagem);
  }

  if (produto.fds) form.append("fds", produto.fds);
  if (produto.analiseFds) form.append("analiseFds", produto.analiseFds);
  if (produto.correcoesFds?.length) {
    form.append("correcoesFds", JSON.stringify(produto.correcoesFds));
  }

  return form;
}

function waitForAnalysis(signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new CanceledError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, 2000);
    function cancel() {
      clearTimeout(timer);
      signal?.removeEventListener("abort", cancel);
      reject(new CanceledError());
    }
    signal?.addEventListener("abort", cancel, { once: true });
  });
}

export async function analyzeFds(
  fds: File,
  signal?: AbortSignal,
  analiseAnterior?: string,
): Promise<FdsAnalysis> {
  try {
    const sessionVersion = useAuthStore.getState().sessionVersion;
    const form = new FormData();
    form.append("fds", await validatePdf(fds));
    if (analiseAnterior !== undefined)
      form.append("analiseAnterior", analysisIdSchema.parse(analiseAnterior));
    const jobPath = `${path}/fds/analises/assincronas`;
    let response = await api.post<unknown>(jobPath, form, { ...multipartConfig, signal });
    const deadline = Date.now() + 5 * 60 * 1000;
    while (true) {
      const job = parseResponse(response, fdsAnalysisJobSchema, "invalid_fds_analysis_response");
      if (job.status === "concluida") return job.analise;
      if (job.status === "falhou") {
        // The polling request succeeds even when extraction fails. Preserve the
        // original failure metadata consumed by the registration form.
        throw new AxiosError(
          job.detail,
          AxiosError.ERR_BAD_RESPONSE,
          response.config,
          response.request,
          { ...response, status: job.codigo, data: { detail: job.detail } },
        );
      }
      if (Date.now() >= deadline) {
        throw new AxiosError("fds_analysis_timeout", AxiosError.ETIMEDOUT, response.config);
      }
      await waitForAnalysis(signal);
      if (useAuthStore.getState().sessionVersion !== sessionVersion) throw new CanceledError();
      response = await api.get<unknown>(`${jobPath}/${job.id}`, { signal });
    }
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.analyzeFds");
  }
}

export async function discardFdsAnalysis(analiseId: string): Promise<void> {
  try {
    await api.post(`${path}/fds/analises/descartar`, {
      analiseId: analysisIdSchema.parse(analiseId),
    });
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.discardFdsAnalysis");
  }
}

export async function create(produto: CadastroProdutoForm): Promise<CadastroProdutoResponse> {
  try {
    const response = await api.post<unknown>(
      path,
      toFormData(await validateProdutoFiles(validateCreateProduto(produto))),
      multipartConfig,
    );
    return parseResponse(response, creationConfirmationSchema, "invalid_product_creation_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.create");
  }
}

export async function update(id: number, produto: AlteracaoProdutoForm): Promise<Produto> {
  try {
    const response = await api.patch<unknown>(
      `${path}/${validateProductId(id)}`,
      toFormData(await validateProdutoFiles(validateUpdateProduto(produto))),
      multipartConfig,
    );
    return parseResponse(response, productSchema, "invalid_product_update_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.update");
  }
}

export async function remove(id: number): Promise<void> {
  try {
    await api.delete(`${path}/${validateProductId(id)}`);
  } catch (cause) {
    throw normalizeServiceError(cause, "produto.remove");
  }
}
