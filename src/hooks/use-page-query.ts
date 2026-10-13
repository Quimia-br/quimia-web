import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { createParser, useQueryState } from "nuqs";

/** UI pages are one-based. Reject partial integers and unsafe numbers. */
export const pageQueryParser = createParser({
  parse: (value: string) => {
    if (!/^[1-9]\d*$/.test(value)) return null;
    const page = Number(value);
    return Number.isSafeInteger(page) ? page : null;
  },
  serialize: (page: number) => String(page),
}).withDefault(1).withOptions({
  history: "push", clearOnDefault: true, scroll: false, shallow: false,
});

/** Supply the API total once known; omit it while fetching pagination metadata. */
export function usePageQuery(totalPages?: number) {
  const location = useLocation();
  const [requestedPage, setPage] = useQueryState("p", pageQueryParser);
  const knownTotal = totalPages !== undefined && Number.isSafeInteger(totalPages) && totalPages > 0
    ? totalPages
    : undefined;
  const page = knownTotal === undefined ? requestedPage : Math.min(requestedPage, knownTotal);

  useEffect(() => {
    if (knownTotal === undefined) return;
    const raw = new URLSearchParams(location.search).get("p");
    if (raw === null) return;
    const parsed = pageQueryParser.parse(raw);
    if (parsed === null || parsed > knownTotal) {
      // Repair stale/invalid links without creating an extra Back step.
      void setPage(parsed === null ? null : knownTotal, { history: "replace" });
    }
  }, [knownTotal, location.search, setPage]);

  function changePage(nextPage: number) {
    if (!Number.isSafeInteger(nextPage) || nextPage < 1) return;
    const next = knownTotal === undefined ? nextPage : Math.min(nextPage, knownTotal);
    if (next !== page) void setPage(next);
  }

  return { page, changePage };
}
