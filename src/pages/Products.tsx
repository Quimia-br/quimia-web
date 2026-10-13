import AddButton from "@/components/AddButton";
import DataDisplayToggle from "@/components/DataDisplayToggle";
import FilterButton from "@/components/FilterButton";
import ProductSearchFields from "@/components/ProductSearchFields";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { DataDisplayProvider } from "@/lib/data-display-provider";
import { useProductSearchFields } from "@/hooks/use-product-search-fields";
import { useId, useState, type ReactNode } from "react";

function ProductsProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DataDisplayProvider>{children}</DataDisplayProvider>
    </ToastProvider>
  );
}

function ProductActions({ filtersOpen, onToggleFilters, filtersId }: { filtersOpen: boolean; onToggleFilters: () => void; filtersId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <SearchBar />
      <FilterButton title="Filtros de produtos" onClick={onToggleFilters} aria-expanded={filtersOpen} aria-controls={filtersOpen ? filtersId : undefined} />
      <DataDisplayToggle />
      <AddButton />
      <ToastViewport
        align="end"
        label="Avisos de produtos"
        className="basis-full sm:flex-1 sm:basis-auto"
      />
    </div>
  );
}

function Products() {
  const { fields } = useProductSearchFields();
  const [filtersOpen, setFiltersOpen] = useState(() => fields.length > 0);
  const filtersId = useId();
  return (
    <>
      <ProductsProviders>
        <Header title="Produtos cadastrados" />
        <ProductActions filtersOpen={filtersOpen} onToggleFilters={() => setFiltersOpen((open) => !open)} filtersId={filtersId} />
        {filtersOpen && <section id={filtersId} aria-label="Campos da busca"><ProductSearchFields /></section>}
      </ProductsProviders>
    </>
  );
}

export default Products;
