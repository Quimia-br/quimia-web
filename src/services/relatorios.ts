import { z } from "zod";
import { api } from "@/services/api";
import { normalizeServiceError, parseResponse } from "./errors";
import type {
  HomeSummary,
  DauDay,
  RecommendationDay,
  TopProduct,
  UserProfile,
  Statistics,
} from "@/types/Relatorios";
// Transitional re-exports preserve callers while consumers move to domain types.
export type {
  HomeSummary,
  DauDay,
  RecommendationDay,
  TopProduct,
  UserProfile,
  ReportSeries,
  ReportCard,
  Statistics,
} from "@/types/Relatorios";

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

async function readReport<T>(
  path: string,
  schema: z.ZodType<T>,
  signal?: AbortSignal,
  params?: Record<string, number>,
): Promise<T> {
  try {
    const response = await api.get<unknown>(`/empresas/me/${path}`, { signal, params });
    return parseResponse(response, schema, "invalid_report_response");
  } catch (cause) {
    throw normalizeServiceError(cause, `relatorios.${path}`);
  }
}

export const getDau = (signal?: AbortSignal): Promise<DauDay[]> =>
  readReport("kpis/dau", z.array(dauSchema), signal);
export const getRecommendations = (signal?: AbortSignal): Promise<RecommendationDay[]> =>
  readReport("kpis/recomendacoes", z.array(recommendationSchema), signal);
export const getTopProducts = (limite = 5, signal?: AbortSignal): Promise<TopProduct[]> =>
  readReport("kpis/top-produtos", z.array(productSchema), signal, { limite });
export const getUserProfile = (signal?: AbortSignal): Promise<UserProfile[]> =>
  readReport("kpis/perfil-usuarios", z.array(profileSchema), signal);
export const getStatistics = (signal?: AbortSignal): Promise<Statistics> =>
  readReport("estatisticas", statisticsSchema, signal);
export const getHomeSummary = (signal?: AbortSignal): Promise<HomeSummary> =>
  readReport("resumo", homeSummarySchema, signal);
