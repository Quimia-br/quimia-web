import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getById } from "@/services/produto";
import { useAuth } from "./use-auth";
import type { Produto } from "@/types/Produto";

export function useProductDetail(id: number | null): UseQueryResult<Produto, Error> {
  const { sessionVersion } = useAuth();
  return useQuery({
    queryKey: ["product-detail", sessionVersion, id],
    enabled: id !== null,
    queryFn: ({ signal }) => {
      if (id === null) throw new Error("Identificador do produto inválido.");
      return getById(id, signal);
    },
    retry: false,
  });
}
