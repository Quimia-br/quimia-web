import { z } from "zod";
import { api } from "@/lib/api";

const count = z.number().int().nonnegative();
const optionalNumber = z.number().nullish();
const dauSchema = z.object({
  data: z.iso.date(),
  usuariosAtivos: count,
  variacaoUsuarios: z.number().int().nullish(),
  variacaoPct: optionalNumber,
  mediaGlobal: optionalNumber,
  media7d: optionalNumber,
  desvioPadrao: optionalNumber,
  zScore: optionalNumber,
});
const recommendationSchema = z.object({
  data: z.iso.date(),
  totalConsultas: count,
  usuariosDistintos: count,
});
const productSchema = z.object({
  idProduto: z.number().int().positive(),
  nomeProduto: z.string(),
  nomeMarca: z.string().nullish(),
  totalConsultas: count,
  ranking: z.number().int().positive(),
});
const profileSchema = z.object({
  nivelAcesso: z.string(),
  estado: z.string(),
  totalUsuarios: count,
});
const seriesSchema = z.object({ rotulo: z.string(), valor: count });
const cardSchema = z.discriminatedUnion("tipo", [
  z.object({
    id: z.string(),
    titulo: z.string(),
    tipo: z.literal("numero"),
    valor: count,
    series: z.array(seriesSchema),
  }),
  z.object({
    id: z.string(),
    titulo: z.string(),
    tipo: z.literal("rosca"),
    valor: count.nullish(),
    series: z.array(seriesSchema),
  }),
]);
const statisticsSchema = z.object({ cards: z.array(cardSchema) });
const homeSummarySchema = z.object({
  produtosEmEstantes: count,
  misturas: z.object({
    total: count,
    bemSucedidas: count,
    malSucedidas: count,
    naoAvaliadas: count,
    taxaSucesso: z.number().min(0).max(1).nullable(),
  }),
});

export type HomeSummary = z.infer<typeof homeSummarySchema>;
export type DauDay = z.infer<typeof dauSchema>;
export type RecommendationDay = z.infer<typeof recommendationSchema>;
export type TopProduct = z.infer<typeof productSchema>;
export type UserProfile = z.infer<typeof profileSchema>;
export type ReportSeries = z.infer<typeof seriesSchema>;

async function readReport<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  params?: Record<string, number>,
) {
  const { data } = await api.get<unknown>(`/empresas/me/${path}`, { signal, params });
  return schema.parse(data);
}

export const getDau = (signal?: AbortSignal) => readReport("kpis/dau", z.array(dauSchema), signal);
export const getRecommendations = (signal?: AbortSignal) =>
  readReport("kpis/recomendacoes", z.array(recommendationSchema), signal);
export const getTopProducts = (limite = 5, signal?: AbortSignal) =>
  readReport("kpis/top-produtos", z.array(productSchema), signal, { limite });
export const getUserProfile = (signal?: AbortSignal) =>
  readReport("kpis/perfil-usuarios", z.array(profileSchema), signal);
export const getStatistics = (signal?: AbortSignal) =>
  readReport("estatisticas", statisticsSchema, signal);
export const getHomeSummary = (signal?: AbortSignal) =>
  readReport("resumo", homeSummarySchema, signal);
