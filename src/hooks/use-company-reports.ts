import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-token";
import {
  getDau,
  getRecommendations,
  getTopProducts,
  getUserProfile,
  getStatistics,
  getHomeSummary,
} from "@/services/relatorios";

function useCompanyReport<T>(name: string, fetcher: (signal: AbortSignal) => Promise<T>) {
  const session = useAuthStore((state) => state.sessionVersion);
  return useQuery({
    queryKey: ["company-reports", session, name],
    queryFn: ({ signal }) => fetcher(signal),
    retry: false,
  });
}

export const useDauReport = () => useCompanyReport("dau", getDau);
export const useRecommendationsReport = () => useCompanyReport("recomendacoes", getRecommendations);
export const useTopProductsReport = () =>
  useCompanyReport("top-produtos-5", (signal) => getTopProducts(5, signal));
export const useUserProfileReport = () => useCompanyReport("perfil-usuarios", getUserProfile);
export const useStatisticsReport = () => useCompanyReport("estatisticas", getStatistics);
export const useHomeSummary = () => useCompanyReport("resumo", getHomeSummary);
