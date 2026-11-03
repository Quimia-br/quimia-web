import { useId, useState, type ReactNode } from "react";
import { useProductSearchFields } from "@/hooks/use-product-search-fields";
import { PRODUCT_SEARCH_FIELDS, type ProductSearchField } from "@/types/Produto";
import ChipFilters, { type ChipFilterOption } from "./ChipFilters";
import FilterButton from "./FilterButton";

const productFieldOptions = [
  { value: "nome", label: "Nome" },
  { value: "tipo", label: "Tipo" },
  { value: "codBarras", label: "Código de barras" },
] as const satisfies readonly ChipFilterOption<ProductSearchField>[];

interface ProductSearchFieldsProps {
  renderActions?: (filterButton: ReactNode) => ReactNode;
  id?: string;
  className?: string;
  disabled?: boolean;
}

function ProductSearchFields({
  renderActions,
  id,
  className,
  disabled = false,
}: ProductSearchFieldsProps) {
  const { fields, setFields } = useProductSearchFields(PRODUCT_SEARCH_FIELDS);
  const [filtersOpen, setFiltersOpen] = useState(() => fields.length > 0);
  const generatedId = useId();
  const filtersId = id ?? generatedId;
  const helpId = `${filtersId}-help`;
  return (
    <>
      {renderActions?.(
        <FilterButton
          title="Filtros de produtos"
          disabled={disabled}
          onClick={() => setFiltersOpen((open) => !open)}
          aria-expanded={filtersOpen}
          aria-controls={filtersOpen ? filtersId : undefined}
        />,
      )}
      {(!renderActions || filtersOpen) && (
        <section id={filtersId} aria-label="Campos da busca">
          <ChipFilters
            className={className}
            disabled={disabled}
            options={productFieldOptions}
            value={fields}
            onValueChange={setFields}
            label="Campos da busca"
            aria-describedby={helpId}
          />
          <p id={helpId} className="sr-only">
            Sem campos selecionados, a pesquisa busca em todos os campos.
          </p>
        </section>
      )}
    </>
  );
}

export default ProductSearchFields;
