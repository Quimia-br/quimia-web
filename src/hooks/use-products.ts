import { useQuery } from "@tanstack/react-query";
import { parseAsString, useQueryState } from "nuqs";
import { useAuthStore } from "@/lib/auth-token";
import { getAll } from "@/services/produto";
import type { ProdutoSearch } from "@/types/Produto";
import { PRODUCT_SEARCH_FIELDS } from "@/types/Produto";
import { usePageQuery } from "./use-page-query";
import { useProductSearchFields } from "./use-product-search-fields";

export function useProducts() {
  const [query] = useQueryState("q", parseAsString.withDefault(""));
  const { effectiveFields } = useProductSearchFields(PRODUCT_SEARCH_FIELDS);
  const { page } = usePageQuery();
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const filters: ProdutoSearch = {
    query: query.trim() || undefined,
    fields: effectiveFields,
    page: page - 1,
    size: 20,
  };

  return useQuery({
    queryKey: ["products", sessionVersion, filters],
    queryFn: ({ signal }) => getAll(filters, signal),
    retry: false,
  });
}
