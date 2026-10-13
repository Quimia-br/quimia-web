import { useCallback } from "react";
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from "nuqs";
import { pageQueryParser } from "./use-page-query";

export const PRODUCT_SEARCH_FIELDS = ["name", "type", "barcode"] as const;
export type ProductSearchField = (typeof PRODUCT_SEARCH_FIELDS)[number];

function canonicalize(values: readonly string[]): ProductSearchField[] {
  return PRODUCT_SEARCH_FIELDS.filter((field) => values.includes(field));
}

const fieldsParser = parseAsArrayOf(parseAsStringLiteral(PRODUCT_SEARCH_FIELDS))
  .withDefault([])
  .withOptions({
  history: "push", clearOnDefault: true, scroll: false, shallow: false,
});

export function useProductSearchFields() {
  const [{ fields: rawFields }, setQuery] = useQueryStates({ fields: fieldsParser, p: pageQueryParser });
  const fields = canonicalize(rawFields);
  const effectiveFields: readonly ProductSearchField[] = fields.length ? fields : PRODUCT_SEARCH_FIELDS;
  const selected = fields.join(",");

  const setFields = useCallback((values: readonly ProductSearchField[]) => {
    const next = canonicalize(values);
    if (next.join(",") === selected) return;
    void setQuery({ fields: next.length ? next : null, p: null }, { history: "push" });
  }, [selected, setQuery]);
  const clearFields = useCallback(() => setFields([]), [setFields]);

  return { fields, effectiveFields, setFields, clearFields };
}
