import { createColumnHelper } from "@tanstack/react-table";
import { cn } from "cn";
import useDataDisplay from "@/hooks/use-data-display";
import { useProducts } from "@/hooks/use-products";
import type { Produto } from "@/types/Produto";
import BasicButton from "./BasicButton";
import DataGrid from "./DataGrid";
import DataGridCard from "./DataGridCard";
import DataTable, { type DataTableFeatures } from "./DataTable";
import PageIndicator from "./PageIndicator";
import ProductImage from "./ProductImage";
import { ScrollArea } from "./ui/scroll-area";
import { TriangleAlert } from "lucide-react";
import EmptyState from "./EmptyState";
import ProductEmptyState from "./ProductEmptyState";

const helper = createColumnHelper<DataTableFeatures, Produto>();
const columns = helper.columns([
  helper.display({
    id: "imagem",
    header: "Imagem",
    cell: ({ row }) => (
      <ProductImage product={row.original} className="h-[70px] w-[51px] shrink-0" />
    ),
  }),
  helper.accessor("nome", {
    header: "Nome",
    cell: ({ row }) => (
      <div className="min-w-[92px] md:min-w-[124px]">
        <span className="block max-w-72 whitespace-normal font-medium [overflow-wrap:anywhere]">
          {row.original.nome}
        </span>
      </div>
    ),
  }),
  helper.accessor("tipo", {
    header: "Tipo",
    cell: ({ getValue }) => getValue()?.replaceAll("_", " ") ?? "—",
  }),
  helper.accessor("descricao", {
    header: "Descrição",
    cell: ({ getValue }) => (
      <span className="block truncate max-w-72" title={getValue() ?? undefined}>
        {getValue() ?? "—"}
      </span>
    ),
  }),
  helper.accessor("codBarras", {
    header: "Código de barras",
    cell: ({ getValue }) => getValue() ?? "—",
  }),
]);
const emptyProducts: Produto[] = [];

function ProductsResults() {
  const { dataDisplay } = useDataDisplay();
  const { data, isError, isPending, isFetching, refetch } = useProducts();
  const products = data?.itens ?? emptyProducts;
  const isEmpty = isError || (!isPending && products.length === 0);

  return (
    <section
      aria-label="Resultados de produtos"
      className="flex flex-col flex-1 min-w-0 min-h-64 gap-4 md:min-h-0"
    >
      <ScrollArea
        className="min-h-0 min-w-0 flex-1 rounded-[60px] bg-surface-base"
        viewportClassName={cn(
          "overscroll-contain px-3 pt-4 pb-8 md:px-8 md:pt-3 [&>div]:block!",
          isEmpty && "[&>div]:grid! [&>div]:min-h-full",
        )}
        maskHeight={0}
      >
        {isError ? (
          <div className="flex min-h-full items-center justify-center">
            <EmptyState
              role="alert"
              icon={<TriangleAlert />}
              title="Não foi possível carregar os produtos."
              description="Verifique sua conexão e tente novamente."
              action={
                <BasicButton
                  variant="secondary"
                  size="compact"
                  disabled={isFetching}
                  onClick={() => void refetch()}
                >
                  {isFetching ? "Tentando novamente…" : "Tentar novamente"}
                </BasicButton>
              }
            />
          </div>
        ) : dataDisplay === "grid" ? (
          <DataGrid
            data={products}
            isLoading={isPending}
            getItemId={(product) => product.id}
            emptyMessage={<ProductEmptyState />}
            aria-label="Produtos cadastrados"
            renderItem={(product) => (
              <DataGridCard
                title={product.nome}
                description={product.descricao ?? product.tipo?.replaceAll("_", " ") ?? undefined}
                media={<ProductImage product={product} className="h-[229px] w-full" />}
              />
            )}
          />
        ) : (
          <DataTable
            data={products}
            isLoading={isPending}
            columns={columns}
            getRowId={(product) => String(product.id)}
            emptyMessage={<ProductEmptyState />}
            aria-label="Produtos cadastrados"
            className="border-separate border-spacing-y-[14px] text-base [&_th]:px-4 [&_td]:bg-surface-background [&_td]:px-4 [&_td]:py-4 [&_td:first-child]:rounded-l-[32px] [&_td:first-child]:pl-8 [&_td:first-child]:pr-0 [&_td:last-child]:rounded-r-[32px] [&_td:last-child]:pr-8"
          />
        )}
      </ScrollArea>
      {data && !isError && (
        <PageIndicator
          totalPages={Math.max(1, data.totalPaginas)}
          disabled={isFetching}
          label="Páginas de produtos"
          className="shrink-0"
        />
      )}
    </section>
  );
}

export default ProductsResults;
