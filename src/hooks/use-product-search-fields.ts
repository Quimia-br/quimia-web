import { useCallback } from "react";
import { parseAsArrayOf, parseAsStringLiteral, useQueryStates } from "nuqs";
import { pageQueryParser } from "./use-page-query";

export function useProductSearchFields<TField extends string>(availableFields: readonly TField[]) {
  const fieldsParser = parseAsArrayOf(parseAsStringLiteral(availableFields))
    .withDefault([])
    .withOptions({
      history: "push",
      clearOnDefault: true,
      scroll: false,
      shallow: false,
    });

  const [{ fields: rawFields }, setQuery] = useQueryStates({
    fields: fieldsParser,
    p: pageQueryParser,
  });
  const rawFieldSet = new Set(rawFields);
  const fields = availableFields.filter((field) => rawFieldSet.has(field));
  const effectiveFields: readonly TField[] = fields.length ? fields : availableFields;
  const selected = fields.join(",");

  const setFields = useCallback(
    (values: readonly TField[]) => {
      const valueSet = new Set(values);
      const next = availableFields.filter((field) => valueSet.has(field));
      if (next.join(",") === selected) return;
      void setQuery({ fields: next.length ? next : null, p: null }, { history: "push" });
    },
    [availableFields, selected, setQuery],
  );
  const clearFields = useCallback(() => setFields([]), [setFields]);

  return { fields, effectiveFields, setFields, clearFields };
}
