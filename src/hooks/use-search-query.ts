import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { parseAsString, useQueryStates } from "nuqs";
import { pageQueryParser } from "./use-page-query";

const searchParser = parseAsString.withDefault("").withOptions({
  history: "replace", clearOnDefault: true, scroll: false, shallow: false,
});

/** Keeps an editable draft separate from the query already applied to the URL. */
export function useSearchQuery(debounceMs: number, disabled: boolean) {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [queryState, setQuery] = useQueryStates({ q: searchParser, p: pageQueryParser });
  const query = queryState.q;
  const [draft, setDraft] = useState({
    locationKey: location.key,
    pathname: location.pathname,
    appliedQuery: query,
    value: query,
    pending: false,
    composing: false,
    changedAt: 0,
  });

  // Keep a pending edit through other query changes on this route. Back/Forward,
  // a different route, or a changed applied search owns the saved value.
  if (draft.appliedQuery !== query || draft.pathname !== location.pathname ||
      (draft.locationKey !== location.key && navigationType === "POP")) {
    setDraft({ locationKey: location.key, pathname: location.pathname, appliedQuery: query, value: query, pending: false, composing: false, changedAt: 0 });
  } else if (draft.locationKey !== location.key) {
    setDraft({ ...draft, locationKey: location.key });
  }

  const apply = useCallback((value: string) => {
    if (disabled) return;
    const normalized = value.trim();
    setDraft((current) => ({ ...current, value: normalized, pending: false, composing: false }));
    if (normalized === query && (normalized !== "" || !new URLSearchParams(location.search).has("q"))) return;
    // Apply the filter and first page together: no request with a stale page.
    void setQuery({ q: normalized || null, p: null }, { history: "replace" });
  }, [disabled, location.search, query, setQuery]);

  useEffect(() => {
    if (!draft.pending || draft.composing || disabled || draft.locationKey !== location.key) return;
    const remaining = Math.max(0, debounceMs - (Date.now() - draft.changedAt));
    const timer = window.setTimeout(() => apply(draft.value), remaining);
    return () => window.clearTimeout(timer);
  }, [apply, debounceMs, disabled, draft, location.key]);

  const change = useCallback((value: string) => {
    setDraft((current) => ({ ...current, value, pending: true, changedAt: Date.now() }));
  }, []);
  const cancelPending = useCallback(() => {
    setDraft((current) => ({ ...current, pending: false }));
  }, []);
  const setComposing = useCallback((composing: boolean) => {
    setDraft((current) => ({ ...current, composing }));
  }, []);

  return { value: draft.value, change, apply, cancelPending, setComposing, scope: location.key };
}
