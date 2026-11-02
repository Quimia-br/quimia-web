import { api } from "@/lib/api";
import { AxiosError } from "axios";
import { z } from "zod";
import { fdsAnalysisSchema } from "@/lib/fds-analysis";
import type { Pagina } from "@/types/Pagina";
import type {
  AlteracaoProdutoForm,
  CadastroProdutoForm,
  CadastroProdutoResponse,
  Produto,
  ProdutoSearch,
} from "@/types/Produto";

const path = "/empresas/me/produtos";
const multipartConfig = { headers: { "Content-Type": "multipart/form-data" } };
// Confirm the persisted product and outcome before the dialog can discard its draft.
const creationConfirmationSchema = z.object({
  produto: z.object({ id: z.number().int().positive() }),
  situacao: z.enum(["criado", "vinculado", "reativado"]),
});
const productPageSchema = z.object({
  itens: z.array(z.object({ id: z.number().int().positive() })),
  pagina: z.number().int().nonnegative(),
  tamanho: z.number().int().positive(),
  totalItens: z.number().int().nonnegative(),
  totalPaginas: z.number().int().nonnegative(),
});

export async function getTypes(signal?: AbortSignal) {
  const { data } = await api.get<string[]>(`${path}/tipos`, { signal });
  return data;
}

export async function getAll(
  { query, fields, ...filters }: ProdutoSearch = {},
  signal?: AbortSignal,
) {
  const response = await api.get<unknown>(path, {
    params: { q: query, fields: fields?.join(","), ...filters },
    signal,
  });
  if (!productPageSchema.safeParse(response.data).success) {
    throw new AxiosError(
      "invalid_product_list_response",
      AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response,
    );
  }
  return response.data as Pagina<Produto>;
}

function toFormData(produto: AlteracaoProdutoForm) {
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

export async function analyzeFds(fds: File, signal?: AbortSignal, analiseAnterior?: string) {
  const form = new FormData();
  form.append("fds", fds);
  if (analiseAnterior) form.append("analiseAnterior", analiseAnterior);
  const response = await api.post<unknown>(`${path}/fds/analises`, form, {
    ...multipartConfig,
    signal,
  });
  const parsed = fdsAnalysisSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new AxiosError(
      "invalid_fds_analysis_response",
      AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response,
    );
  }
  return parsed.data;
}

export async function discardFdsAnalysis(analiseId: string) {
  await api.post(`${path}/fds/analises/descartar`, { analiseId });
}

export async function create(produto: CadastroProdutoForm) {
  const response = await api.post<unknown>(path, toFormData(produto), multipartConfig);
  if (!creationConfirmationSchema.safeParse(response.data).success) {
    throw new AxiosError(
      "invalid_product_creation_response",
      AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response,
    );
  }
  return response.data as CadastroProdutoResponse;
}

export async function update(id: number, produto: AlteracaoProdutoForm) {
  const { data } = await api.patch<Produto>(`${path}/${id}`, toFormData(produto), multipartConfig);

  return data;
}

export async function remove(id: number): Promise<void> {
  await api.delete(`${path}/${id}`);
}
