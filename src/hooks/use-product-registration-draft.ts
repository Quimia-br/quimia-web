import { useCallback, useEffect, useRef, useReducer } from "react";
import { productRegistrationReducer } from "@/lib/product-registration-reducer";
import {
  clearProductDraft,
  emptyProductDraft,
  loadProductDraft,
  saveProductDraft,
} from "@/lib/product-registration-draft";
import type { ProductRegistrationDraft, UpdateProductDraft } from "@/types/ProductRegistration";

/** Files use IndexedDB structured cloning; no access tokens, cookies or credentials enter the draft. */
export function useProductRegistrationDraft(
  ownerId: number | null,
  report: (message: string) => void,
) {
  const [state, dispatch] = useReducer(productRegistrationReducer, {
    status: ownerId === null ? "ready" : "loading",
    draft: emptyProductDraft(),
    recoveryNotice: null,
  });
  const { draft, recoveryNotice } = state;
  const ready = state.status !== "loading";
  const storageWarning = useRef(false);
  const reportRef = useRef(report);
  useEffect(() => {
    reportRef.current = report;
  }, [report]);
  useEffect(() => {
    if (ownerId === null) return;
    let active = true;
    void loadProductDraft(ownerId)
      .then((saved) => {
        if (!active) return;
        dispatch({
          type: "restored",
          draft: saved ?? emptyProductDraft(),
          recoveryNotice: saved?.recoveryNotice ?? null,
        });
      })
      .catch(() => {
        if (!active) return;
        storageWarning.current = true;
        reportRef.current(
          "Não foi possível recuperar o rascunho neste navegador. Você pode continuar o cadastro.",
        );
        dispatch({ type: "storage-failed" });
      });
    return () => {
      active = false;
    };
  }, [ownerId]);
  useEffect(() => {
    if (!ready || ownerId === null || !draft.open) return;
    void saveProductDraft(ownerId, draft).catch(() => {
      if (storageWarning.current) return;
      storageWarning.current = true;
      reportRef.current(
        "Não foi possível salvar o rascunho neste navegador. Mantenha esta página aberta para não perder os dados.",
      );
    });
  }, [draft, ownerId, ready]);
  const update: UpdateProductDraft = useCallback((patch) => {
    dispatch({ type: "update", patch });
  }, []);
  const clear = useCallback(() => {
    dispatch({ type: "clear" });
    if (ownerId !== null)
      void clearProductDraft(ownerId).catch(() => {
        reportRef.current("Não foi possível apagar o rascunho salvo neste navegador.");
      });
  }, [ownerId]);
  // Finish writing the operation marker before sending a request with server-side effects.
  const checkpoint = useCallback(
    async (next: ProductRegistrationDraft) => {
      dispatch({ type: "checkpoint", draft: next });
      if (ownerId === null) return true;
      try {
        await saveProductDraft(ownerId, next);
        return true;
      } catch {
        storageWarning.current = true;
        reportRef.current(
          "Não foi possível salvar o rascunho neste navegador. O envio não foi iniciado. Tente novamente mantendo esta página aberta.",
        );
        return false;
      }
    },
    [ownerId],
  );
  return { draft, ready, update, clear, checkpoint, recoveryNotice };
}
