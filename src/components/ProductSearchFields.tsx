import { useId } from "react";
import { useProductSearchFields } from "@/hooks/use-product-search-fields";
import ChipFilters from "./ChipFilters";

const productFieldOptions = [
  { value: "name", label: "Nome" },
  { value: "type", label: "Tipo" },
  { value: "barcode", label: "Código de barras" },
] as const;

interface ProductSearchFieldsProps {
  id?: string;
  className?: string;
  disabled?: boolean;
}

function ProductSearchFields({ id, className, disabled = false }: ProductSearchFieldsProps) {
  const { fields, setFields } = useProductSearchFields();
  const generatedId = useId();
  const helpId = `${id ?? generatedId}-help`;
  return (
    <>
      <ChipFilters
        id={id}
        className={className}
        disabled={disabled}
        options={productFieldOptions}
        value={fields}
        onValueChange={setFields}
        label="Campos da busca"
        aria-describedby={helpId}
      />
      <p id={helpId} className="sr-only">Sem campos selecionados, a pesquisa busca em todos os campos.</p>
    </>
  );
}

export default ProductSearchFields;
