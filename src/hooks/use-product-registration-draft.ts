import { useCallback, useEffect, useRef, useState } from "react";
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
  const [draft, setDraft] = useState<ProductRegistrationDraft>(emptyProductDraft);
  const [ready, setReady] = useState(ownerId === null);
  const [recoveryNotice, setRecoveryNotice] = useState<"submission" | null>(null);
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
        if (saved) {
          const { recoveryNotice, ...restored } = saved;
          setDraft(restored);
          setRecoveryNotice(recoveryNotice ?? null);
        }
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        storageWarning.current = true;
        reportRef.current(
          "Não foi possível recuperar o rascunho neste navegador. Você pode continuar o cadastro.",
        );
        setReady(true);
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
    setDraft((current) =>
      typeof patch === "function" ? patch(current) : { ...current, ...patch },
    );
  }, []);
  const clear = useCallback(() => {
    setDraft(emptyProductDraft());
    if (ownerId !== null)
      void clearProductDraft(ownerId).catch(() => {
        reportRef.current("Não foi possível apagar o rascunho salvo neste navegador.");
      });
  }, [ownerId]);
  // Finish writing the operation marker before sending a request with server-side effects.
  const checkpoint = useCallback(
    async (next: ProductRegistrationDraft) => {
      setDraft(next);
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
