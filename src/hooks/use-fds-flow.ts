import { useEffect, useImperativeHandle, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { analyzeFds, discardFdsAnalysis } from "@/services/produto";
import { fdsError } from "@/lib/fds-error";
import { withFinally } from "@/lib/utils/withFinally";
import { useToast } from "@/hooks/use-toast";
import { validateFdsFile } from "@/lib/utils/product-form-validation";
import type { FdsAnalysis } from "@/types/Produto";
import type { ProductFdsDraft, ProductRegistrationView } from "@/types/ProductRegistration";
import type { ProductFdsFlowProps } from "@/components/ProductFdsFlow";

export function useFdsFlow({
  view,
  product,
  busy,
  error,
  flowRef,
  onViewChange,
  onSubmit,
  onEdit,
  onCleanupError,
  onBeforeAnalyze,
  draft,
  onDraftChange,
}: ProductFdsFlowProps) {
  const toast = useToast();
  const stage = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<FdsAnalysis | null>(draft.analysis);
  const analyzedFile = useRef<File | null>(draft.analyzedFile);
  const abandoned = useRef(false);
  const operation = useRef(false);
  const removalOperation = useRef(false);
  const selection = useRef(0);
  const origin = useRef<ProductRegistrationView>("upload");
  const { file, analysis, corrections } = draft;
  function setFile(file: File | null, selectionAnalyzed = false) {
    onDraftChange({ file, selectionAnalyzed });
  }
  const [validating, setValidating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removalPending, setRemovalPending] = useState(false);
  const extraction = useMutation({
    mutationFn: async (pdf: File) => {
      const data = await analyzeFds(pdf, undefined, analysisRef.current?.analiseId);
      // Cancellation can happen while the server is reading the PDF. Wait for its ID so the stored file can be removed.
      if (abandoned.current) {
        try {
          await discardFdsAnalysis(data.analiseId);
        } catch {
          onCleanupError();
        }
        return null;
      }
      return data;
    },
    retry: false,
    onSuccess: (data, pdf) => {
      if (!data || abandoned.current) return;
      analysisRef.current = data;
      analyzedFile.current = pdf;
      onDraftChange({
        file: pdf,
        analyzedFile: pdf,
        selectionAnalyzed: true,
        analysis: data,
        corrections: [],
      });
      onViewChange(data.pendencias.length ? "review" : "success");
    },
    onError: (failure) => {
      if (!abandoned.current) {
        onViewChange(origin.current);
        if (!axios.isCancel(failure))
          toast.add({
            id: "product-fds-error",
            type: "error",
            priority: "high",
            title: "Não foi possível analisar a FDS",
            description: fdsError(failure) ?? "Seu arquivo foi mantido; tente novamente.",
          });
      }
    },
    onSettled: () => {
      operation.current = false;
    },
  });
  useImperativeHandle(flowRef, () => ({
    hasAnalysis: () => !!analysisRef.current || operation.current,
    isDiscarding: () => removalOperation.current,
    discard: async () => {
      abandoned.current = true;
      const current = analysisRef.current;
      if (current) {
        try {
          await discardFdsAnalysis(current.analiseId);
        } catch (failure) {
          abandoned.current = false;
          throw failure;
        }
        analysisRef.current = null;
      }
    },
  }));
  useEffect(() => {
    if (view !== "details") stage.current?.focus();
  }, [view]);

  const locked = busy || extraction.isPending || removalPending;
  const invalidAnalysis =
    axios.isAxiosError<{ detail?: string }>(error) &&
    ["analise_expirada", "analise_invalida"].includes(error.response?.data?.detail ?? "");
  const remaining =
    analysis?.pendencias.filter(
      (pending) =>
        !pending.corrigivel ||
        !corrections.some((correction) => correction.indice === pending.composto?.indice),
    ).length ?? 0;

  async function selectFile(next: File) {
    if (locked) return;
    const current = ++selection.current;
    setValidating(true);
    await withFinally(
      async () => {
        try {
          await validateFdsFile(next);
          if (current !== selection.current) return;
          setFile(next);
          toast.close("product-file-error");
          extraction.reset();
          onEdit();
        } catch (failure) {
          if (current === selection.current)
            toast.add({
              id: "product-file-error",
              type: "error",
              priority: "high",
              title: "Não foi possível usar o PDF",
              description:
                failure instanceof Error ? failure.message : "Não foi possível ler o arquivo.",
            });
        }
      },
      () => {
        if (current === selection.current) setValidating(false);
      },
    );
  }
  async function extract() {
    if (!file || operation.current || busy || validating) return;
    operation.current = true;
    toast.close("product-fds-error");
    origin.current = view === "replace" ? "replace" : "upload";
    onEdit();
    onViewChange("analyzing");
    const allowed = await onBeforeAnalyze();
    if (!allowed || abandoned.current) {
      operation.current = false;
      if (!abandoned.current) onViewChange(origin.current);
      return;
    }
    extraction.mutate(file);
  }
  function submit() {
    if (!analysis || locked) return;
    if (invalidAnalysis || Date.parse(analysis.expiraEm) <= Date.now()) {
      extract();
      return;
    }
    onSubmit({ ...product, analiseFds: analysis.analiseId, correcoesFds: corrections });
  }
  function editDocument() {
    setFile(null);
    extraction.reset();
    onEdit();
    onViewChange("replace");
  }
  async function removeFile() {
    if (locked || removalOperation.current) return;
    removalOperation.current = true;
    setRemovalPending(true);
    await withFinally(
      async () => {
        try {
          if (analysisRef.current) await discardFdsAnalysis(analysisRef.current.analiseId);
          analysisRef.current = null;
          analyzedFile.current = null;
          selection.current++;
          onDraftChange({
            file: null,
            analyzedFile: null,
            selectionAnalyzed: false,
            analysis: null,
            corrections: [],
          });
          setRemoving(false);
          extraction.reset();
          onEdit();
        } catch (failure) {
          toast.add({
            type: "error",
            priority: "high",
            title: "Não foi possível remover a FDS",
            description: fdsError(failure) ?? "Tente novamente.",
          });
        }
      },
      () => {
        removalOperation.current = false;
        setRemovalPending(false);
      },
    );
  }

  function correct(index: number, correction: ProductFdsDraft["corrections"][number] | null) {
    onDraftChange((current) => ({
      ...current,
      corrections: [
        ...current.corrections.filter((item) => item.indice !== index),
        ...(correction ? [correction] : []),
      ],
    }));
    onEdit();
  }
  function editDetails() {
    onEdit();
    onViewChange("details");
  }
  function back() {
    if (view === "replace") {
      setFile(analyzedFile.current, true);
      onViewChange(analysis ? (analysis.pendencias.length ? "review" : "success") : "upload");
    } else onViewChange("details");
    onEdit();
  }
  function continueFlow() {
    if (
      analysis &&
      draft.selectionAnalyzed &&
      !invalidAnalysis &&
      Date.parse(analysis.expiraEm) > Date.now()
    )
      onViewChange(analysis.pendencias.length ? "review" : "success");
    else extract();
  }
  function changeRemovalOpen(next: boolean) {
    if (!removalOperation.current) setRemoving(next);
  }
  function requestRemove() {
    setRemoving(true);
  }
  return {
    stage,
    file,
    analysis,
    corrections,
    validating,
    removing,
    removalPending,
    locked,
    invalidAnalysis,
    remaining,
    selectFile,
    extract,
    submit,
    editDocument,
    removeFile,
    correct,
    editDetails,
    back,
    continueFlow,
    changeRemovalOpen,
    requestRemove,
  };
}
