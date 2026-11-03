import { useEffect, useImperativeHandle, useRef, useState, type Ref, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { cn } from "cn";
import { FileText } from "lucide-react";
import { analyzeFds, discardFdsAnalysis } from "@/services/produto";
import { fdsError } from "@/lib/fds-error";
import { withFinally } from "@/lib/utils/withFinally";
import { useToast } from "@/hooks/use-toast";
import type { ProductFdsDraft, ProductRegistrationView } from "@/types/ProductRegistration";
import type { CadastroProdutoForm, FdsAnalysis } from "@/types/Produto";
import BasicButton from "./BasicButton";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./ui/dialog";
import { FdsFilePicker, FdsProductPreview } from "./ProductFdsUpload";
import ProductFdsReview from "./ProductFdsReview";

export type { ProductRegistrationView } from "@/types/ProductRegistration";
export interface FdsFlowHandle {
  hasAnalysis: () => boolean;
  isDiscarding: () => boolean;
  discard: () => Promise<void>;
}
interface Props {
  view: ProductRegistrationView;
  product: CadastroProdutoForm;
  busy: boolean;
  error: unknown;
  flowRef: Ref<FdsFlowHandle>;
  onViewChange: (view: ProductRegistrationView) => void;
  onSubmit: (product: CadastroProdutoForm) => void;
  onEdit: () => void;
  onCleanupError: () => void;
  onBeforeAnalyze: () => Promise<boolean>;
  draft: ProductFdsDraft;
  onDraftChange: (
    patch: Partial<ProductFdsDraft> | ((draft: ProductFdsDraft) => ProductFdsDraft),
  ) => void;
}
function readSignature(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsText(file.slice(0, 5));
  });
}
async function validateFdsFile(next: File) {
  if (next.size > 10 * 1024 * 1024) throw new Error("O PDF deve ter no máximo 10 MB.");
  if (
    !next.size ||
    !next.name.toLowerCase().endsWith(".pdf") ||
    (await readSignature(next)) !== "%PDF-"
  )
    throw new Error("Escolha um PDF válido da Ficha de Dados de Segurança.");
}

export default function ProductFdsFlow({
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
}: Props) {
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

  const picker = (
    <FdsFilePicker
      file={file}
      disabled={locked || validating}
      onSelect={selectFile}
      onRemove={() => setRemoving(true)}
      replace={view === "replace"}
    />
  );
  return (
    <div
      ref={stage}
      tabIndex={-1}
      hidden={view === "details"}
      className={`${view === "details" ? "hidden" : "flex"} min-h-0 flex-1 flex-col gap-3.5 outline-none`}
    >
      {view === "analyzing" ? (
        <FdsAnalyzingStatus />
      ) : (
        <>
          <FdsFlowContent
            view={view}
            product={product}
            picker={picker}
            analysis={analysis}
            corrections={corrections}
            locked={locked}
            onCorrect={(index, correction) => {
              onDraftChange((current) => ({
                ...current,
                corrections: [
                  ...current.corrections.filter((item) => item.indice !== index),
                  ...(correction ? [correction] : []),
                ],
              }));
              onEdit();
            }}
          />
          <FdsFlowFeedback
            error={error}
            invalidAnalysis={invalidAnalysis}
            view={view}
            locked={locked}
            onExtract={extract}
            onEditDetails={() => {
              onEdit();
              onViewChange("details");
            }}
          />
          <FdsFlowActions
            view={view}
            busy={busy}
            remaining={remaining}
            locked={locked}
            validating={validating}
            hasFile={!!file}
            removing={removing}
            onSubmit={submit}
            onEditDocument={editDocument}
            onBack={() => {
              if (view === "replace") {
                setFile(analyzedFile.current, true);
                onViewChange(
                  analysis ? (analysis.pendencias.length ? "review" : "success") : "upload",
                );
              } else onViewChange("details");
              onEdit();
            }}
            onContinue={() => {
              if (
                analysis &&
                draft.selectionAnalyzed &&
                !invalidAnalysis &&
                Date.parse(analysis.expiraEm) > Date.now()
              )
                onViewChange(analysis.pendencias.length ? "review" : "success");
              else extract();
            }}
          />
        </>
      )}
      <RemoveFdsDialog
        open={removing}
        removalPending={removalPending}
        onOpenChange={(next) => {
          if (!removalOperation.current) setRemoving(next);
        }}
        onRemove={removeFile}
      />
    </div>
  );
}

function FdsFlowContent({
  view,
  product,
  picker,
  analysis,
  corrections,
  locked,
  onCorrect,
}: {
  view: ProductRegistrationView;
  product: CadastroProdutoForm;
  picker: ReactNode;
  analysis: FdsAnalysis | null;
  corrections: ProductFdsDraft["corrections"];
  locked: boolean;
  onCorrect: (index: number, correction: ProductFdsDraft["corrections"][number] | null) => void;
}) {
  return (
    <ScrollArea
      maskHeight={0}
      className="-mx-2 flex min-h-0 flex-1 flex-col"
      viewportClassName="h-auto min-h-0 flex-1 overscroll-contain px-2 [&>div]:block!"
    >
      {view === "upload" ? (
        <div className="grid min-w-0 items-center gap-6 @min-[720px]:grid-cols-[292px_minmax(0,1fr)] @min-[720px]:gap-[68px]">
          <FdsProductPreview product={product} />
          <div className="flex min-w-0 flex-col gap-2.5">
            <h3 className="max-w-[365px] text-2xl leading-none font-medium">
              Adicionar Ficha de Dados de Segurança (FDS)
            </h3>
            <p className="mt-5 text-[15px] leading-tight text-muted-foreground">
              Anexe abaixo a documentação padronizada conforme a ABNT NBR 14725, cuja
              disponibilização é obrigatória de acordo com a Norma Regulamentadora nº 26 (NR-26) do
              Ministério do Trabalho.
            </p>
            {picker}
          </div>
        </div>
      ) : view === "replace" ? (
        picker
      ) : (
        analysis && (
          <ProductFdsReview
            analysis={analysis}
            corrections={corrections}
            disabled={locked}
            onCorrect={onCorrect}
          />
        )
      )}
    </ScrollArea>
  );
}

function FdsFlowActions({
  view,
  busy,
  remaining,
  locked,
  validating,
  hasFile,
  removing,
  onSubmit,
  onEditDocument,
  onBack,
  onContinue,
}: {
  view: ProductRegistrationView;
  busy: boolean;
  remaining: number;
  locked: boolean;
  validating: boolean;
  hasFile: boolean;
  removing: boolean;
  onSubmit: () => void;
  onEditDocument: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div className={cn("flex shrink-0 gap-2.5", view !== "review" && view !== "success" && "pt-3")}>
      {view === "review" ? (
        <>
          <BasicButton
            variant="secondary"
            className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
            disabled={locked}
            onClick={onSubmit}
          >
            {busy ? "Adicionando…" : remaining ? "Adicionar mesmo assim" : "Continuar"}
          </BasicButton>
          <BasicButton
            className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
            disabled={locked}
            onClick={onEditDocument}
          >
            Substituir documento corrigido
          </BasicButton>
        </>
      ) : view === "success" ? (
        <BasicButton
          className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
          disabled={locked}
          onClick={onSubmit}
        >
          {busy ? "Adicionando…" : "Continuar"}
        </BasicButton>
      ) : (
        <FdsUploadActions
          view={view}
          locked={locked}
          validating={validating}
          hasFile={hasFile}
          removing={removing}
          onBack={onBack}
          onContinue={onContinue}
        />
      )}
    </div>
  );
}

function RemoveFdsDialog({
  open,
  removalPending,
  onOpenChange,
  onRemove,
}: {
  open: boolean;
  removalPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex w-[498px] max-w-[calc(100%-2rem)] flex-col gap-6 rounded-[36px] bg-surface-background p-8 sm:max-w-[498px]"
      >
        <DialogTitle className="text-xl">Remover a FDS selecionada?</DialogTitle>
        <DialogDescription>
          Você poderá escolher outro documento para continuar o cadastro.
        </DialogDescription>
        <div className="flex gap-3">
          <BasicButton
            variant="secondary"
            size="compact"
            className="min-w-0 flex-1"
            disabled={removalPending}
            onClick={() => onOpenChange(false)}
          >
            Voltar
          </BasicButton>
          <BasicButton
            variant="critical"
            size="compact"
            className="min-w-0 flex-1"
            disabled={removalPending}
            onClick={() => {
              void onRemove();
            }}
          >
            Remover arquivo
          </BasicButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FdsAnalyzingStatus() {
  return (
    <div
      role="status"
      aria-label="Análise da FDS em andamento"
      className="flex min-h-[178px] flex-col items-center justify-center gap-5 py-8"
    >
      <span className="flex h-[90px] w-[100px] items-center justify-center rounded-full bg-secondary-primary">
        <FileText className="size-8" aria-hidden="true" />
      </span>
      <div
        role="progressbar"
        aria-label="Analisando documento"
        className="h-1.5 w-full max-w-[360px] overflow-hidden rounded-full bg-secondary-primary"
      >
        <div className="h-full w-1/3 rounded-full bg-brand-accent motion-safe:animate-pulse" />
      </div>
    </div>
  );
}

function FdsUploadActions({
  view,
  locked,
  validating,
  hasFile,
  removing,
  onBack,
  onContinue,
}: {
  view: ProductRegistrationView;
  locked: boolean;
  validating: boolean;
  hasFile: boolean;
  removing: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <>
      <BasicButton
        variant="secondary"
        className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
        disabled={locked || validating}
        onClick={onBack}
      >
        Voltar
      </BasicButton>
      <BasicButton
        className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
        disabled={locked || validating || !hasFile || removing}
        onClick={onContinue}
      >
        {validating ? "Verificando PDF…" : view === "replace" ? "Adicionar produto" : "Continuar"}
      </BasicButton>
    </>
  );
}

function FdsFlowFeedback({
  error,
  invalidAnalysis,
  view,
  locked,
  onExtract,
  onEditDetails,
}: {
  error: unknown;
  invalidAnalysis: boolean;
  view: ProductRegistrationView;
  locked: boolean;
  onExtract: () => void;
  onEditDetails: () => void;
}) {
  return (
    <>
      {error && !invalidAnalysis && (view === "review" || view === "success") ? (
        <BasicButton variant="secondary" size="compact" disabled={locked} onClick={onEditDetails}>
          Editar dados do produto
        </BasicButton>
      ) : null}
      {invalidAnalysis && (
        <BasicButton variant="secondary" size="compact" disabled={locked} onClick={onExtract}>
          Reanalisar FDS
        </BasicButton>
      )}
    </>
  );
}
