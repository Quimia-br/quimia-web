import { useFdsFlow } from "@/hooks/use-fds-flow";
import type { Ref, ReactNode } from "react";
import { cn } from "cn";
import { FileText } from "lucide-react";
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
export interface ProductFdsFlowProps {
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
}: ProductFdsFlowProps) {
  const {
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
  } = useFdsFlow({
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
  });

  const picker = (
    <FdsFilePicker
      file={file}
      disabled={locked || validating}
      onSelect={selectFile}
      onRemove={requestRemove}
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
            onCorrect={correct}
          />
          <FdsFlowFeedback
            error={error}
            invalidAnalysis={invalidAnalysis}
            view={view}
            locked={locked}
            onExtract={extract}
            onEditDetails={editDetails}
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
            onBack={back}
            onContinue={continueFlow}
          />
        </>
      )}
      <RemoveFdsDialog
        open={removing}
        removalPending={removalPending}
        onOpenChange={changeRemovalOpen}
        onRemove={removeFile}
      />
    </div>
  );
}

interface FdsFlowContentProps {
  view: ProductRegistrationView;
  product: CadastroProdutoForm;
  picker: ReactNode;
  analysis: FdsAnalysis | null;
  corrections: ProductFdsDraft["corrections"];
  locked: boolean;
  onCorrect: (index: number, correction: ProductFdsDraft["corrections"][number] | null) => void;
}

function FdsFlowContent({
  view,
  product,
  picker,
  analysis,
  corrections,
  locked,
  onCorrect,
}: FdsFlowContentProps) {
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

interface FdsFlowActionsProps {
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
}: FdsFlowActionsProps) {
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

interface RemoveFdsDialogProps {
  open: boolean;
  removalPending: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => Promise<void>;
}

function RemoveFdsDialog({ open, removalPending, onOpenChange, onRemove }: RemoveFdsDialogProps) {
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

interface FdsUploadActionsProps {
  view: ProductRegistrationView;
  locked: boolean;
  validating: boolean;
  hasFile: boolean;
  removing: boolean;
  onBack: () => void;
  onContinue: () => void;
}

function FdsUploadActions({
  view,
  locked,
  validating,
  hasFile,
  removing,
  onBack,
  onContinue,
}: FdsUploadActionsProps) {
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

interface FdsFlowFeedbackProps {
  error: unknown;
  invalidAnalysis: boolean;
  view: ProductRegistrationView;
  locked: boolean;
  onExtract: () => void;
  onEditDetails: () => void;
}

function FdsFlowFeedback({
  error,
  invalidAnalysis,
  view,
  locked,
  onExtract,
  onEditDetails,
}: FdsFlowFeedbackProps) {
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
