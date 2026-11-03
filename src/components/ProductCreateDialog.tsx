import { useProductCreateSession } from "@/hooks/use-product-create-session";
import { useProductCreateForm, MAX_PRODUCT_IMAGE_SIZE } from "@/hooks/use-product-create-form";
import type { ReactElement, RefObject } from "react";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProductCreateDialogHandle } from "@/lib/product-create-dialog-context";
import type { ProductRegistrationDraft, UpdateProductDraft } from "@/types/ProductRegistration";
import { ToastProvider, ToastViewport } from "./Toast";
import type { CadastroProdutoForm } from "@/types/Produto";
import AddButton from "./AddButton";
import ActionInput from "./ActionInput";
import BasicButton from "./BasicButton";
import { DropdownControl } from "./Dropdown";
import { ImageContainer } from "./ImageContainer";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { ScrollArea } from "./ui/scroll-area";
import ProductFdsFlow, { type FdsFlowHandle, type ProductRegistrationView } from "./ProductFdsFlow";

const fields = [
  { name: "nome", label: "Nome", placeholder: "Limpa vidros", maxLength: 255 },
  { name: "tipo", label: "Tipo", placeholder: "Selecione", maxLength: 50 },
  { name: "descricao", label: "Descrição", placeholder: "Descreva o produto", maxLength: 4000 },
  {
    name: "codBarras",
    label: "Código de barras",
    placeholder: "Ex.: 7891234567895",
    maxLength: 255,
  },
] as const;

interface ProductCreateDialogProps {
  trigger?: ReactElement;
}

function ProductCreateDialog({ trigger }: ProductCreateDialogProps) {
  const pageToast = useToast();
  const handle = useProductCreateDialogHandle();
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  return (
    <ToastProvider key={ownerId ?? "anonymous"}>
      <ProductCreateSession
        trigger={trigger}
        handle={handle}
        ownerId={ownerId}
        onSaved={(title) => pageToast.add({ type: "success", title })}
        onOutsideError={(description) =>
          pageToast.add({
            type: "error",
            priority: "high",
            title: "Cadastro de produto",
            description,
          })
        }
      />
    </ToastProvider>
  );
}

const reviewDescription =
  "As pendências presentes no documento podem impactar as misturas que o usuário fará.";

const registrationViews: Record<
  ProductRegistrationView,
  { title: string; description: string; width: number }
> = {
  details: {
    title: "Cadastrar novo produto",
    description: "Preencha as informações do produto abaixo",
    width: 841,
  },

  upload: {
    title: "Cadastrar novo produto",
    description: "Preencha as informações do produto abaixo",
    width: 998,
  },

  analyzing: {
    title: "Estamos analisando sua FDS",
    description:
      "O documento anexado pode apresentar pendências. Por favor, aguarde até que elas sejam apresentadas.",
    width: 793,
  },

  replace: { title: "Alterar FDS", description: "Anexe o documento corrigido abaixo", width: 708 },

  review: { title: "Pendências identificadas", description: reviewDescription, width: 793 },

  success: { title: "Pendências identificadas", description: reviewDescription, width: 692 },
};

interface CancelAnalysisDialogProps {
  open: boolean;

  discarding: boolean;

  onOpenChange: (open: boolean) => void;

  onConfirm: () => Promise<void>;
}

function CancelAnalysisDialog({
  open,
  discarding,
  onOpenChange,
  onConfirm,
}: CancelAnalysisDialogProps) {
  return (
    <Dialog
      open={open}

      onOpenChange={(next) => {
        if (!discarding) onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-[498px] max-w-[calc(100%-2rem)] flex-col gap-6 rounded-[36px] bg-surface-background p-8 sm:max-w-[498px]"
      >
        <div className="flex items-center gap-5">
          <span className="flex size-[100px] shrink-0 items-center justify-center rounded-full border-3 border-feedback-error bg-secondary-primary text-feedback-error sm:size-[134px]">
            <TriangleAlert className="size-7" aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <DialogTitle className="text-xl leading-tight">
              Tem certeza que deseja cancelar a análise da FDS?
            </DialogTitle>
            <DialogDescription className="text-sm leading-none">
              Você terá que carregar o documento novamente e o cadastro do produto será cancelado.
            </DialogDescription>
          </div>
        </div>
        <div className="flex gap-3">
          <BasicButton
            variant="secondary"
            size="compact"
            className="min-h-11 min-w-0 flex-1 py-2 text-sm leading-[1.2] sm:min-h-9"
            disabled={discarding}

            onClick={() => onOpenChange(false)}
          >
            Continuar
          </BasicButton>
          <BasicButton
            variant="critical"
            size="compact"
            className="min-h-11 min-w-0 flex-1 py-2 text-sm leading-[1.2] sm:min-h-9"
            disabled={discarding}

            onClick={onConfirm}
          >
            {discarding ? "Cancelando…" : "Cancelar"}
          </BasicButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ProductCreateSessionProps {
  trigger?: ReactElement;
  handle: ReturnType<typeof useProductCreateDialogHandle>;
  ownerId: number | null;
  onSaved: (title: string) => void;
  onOutsideError: (message: string) => void;
}

function ProductCreateSession({
  trigger,
  handle,
  ownerId,
  onSaved,
  onOutsideError,
}: ProductCreateSessionProps) {
  const {
    draft,
    ready,
    updateDraft,
    open,
    view,
    setView,
    confirmCancel,
    setConfirmCancel,
    discarding,
    preparingSubmission,
    flowRef,
    mutation,
    submit,
    requestClose,
    cleanupError,
    onOpenChange,
    edit,
    beforeAnalyze,
    confirmCancellation,
  } = useProductCreateSession({ ownerId, onSaved, onOutsideError });
  const reviewing = view === "review" || view === "success";

  const { title, description, width } = registrationViews[view];

  return (
    <>
      <Dialog handle={handle} open={open} onOpenChange={onOpenChange}>
        <DialogTrigger
          disabled={!ready}
          render={trigger ?? <AddButton aria-label="Cadastrar produto" />}
        />
        <DialogContent
          showCloseButton={false}
          aria-busy={preparingSubmission || mutation.isPending || view === "analyzing"}
          style={{ width }}
          className={cn(
            "@container flex max-h-[calc(100dvh-2rem)] max-w-[calc(100%-2rem)] flex-col gap-3.5 overflow-hidden rounded-[40px] p-6 text-foreground-primary ring-0 sm:max-w-[calc(100%-3rem)] sm:rounded-[60px] sm:px-[60px] sm:py-[50px]",
            reviewing ? "bg-surface-base" : "bg-surface-background",
          )}
        >
          <DialogHeader className="shrink-0 gap-4 py-6 pr-16">
            <DialogTitle className="text-2xl leading-none sm:text-[2rem]">{title}</DialogTitle>
            <DialogDescription className="text-base leading-none sm:text-xl">
              {description}
            </DialogDescription>
          </DialogHeader>
          <Button
            type="button"
            disabled={preparingSubmission || mutation.isPending || discarding}
            aria-label="Fechar cadastro de produto"
            variant="onColor"
            size="icon-sm"
            className="absolute right-6 top-6 rounded-full sm:right-[60px] sm:top-[50px] sm:size-[70px]"
            onClick={requestClose}
          >
            <X aria-hidden="true" />
          </Button>
          <ToastViewport label="Avisos do cadastro" className="shrink-0" />
          {open && (
            <ProductCreateForm
              busy={preparingSubmission || mutation.isPending}
              error={mutation.error}
              onSubmit={submit}
              onEdit={edit}
              onCancel={requestClose}
              view={view}
              onViewChange={setView}
              flowRef={flowRef}
              onCleanupError={cleanupError}
              draft={draft}
              updateDraft={updateDraft}
              onBeforeAnalyze={beforeAnalyze}
            />
          )}
        </DialogContent>
      </Dialog>
      <CancelAnalysisDialog
        open={confirmCancel}

        discarding={discarding}

        onOpenChange={setConfirmCancel}

        onConfirm={confirmCancellation}
      />
    </>
  );
}

interface ProductCreateFormProps {
  busy: boolean;
  error: unknown;
  onSubmit: (value: CadastroProdutoForm) => void;
  onEdit: () => void;
  onCancel: () => void;
  view: ProductRegistrationView;
  onViewChange: (view: ProductRegistrationView) => void;
  flowRef: RefObject<FdsFlowHandle | null>;
  onCleanupError: () => void;
  draft: ProductRegistrationDraft;
  updateDraft: UpdateProductDraft;
  onBeforeAnalyze: () => Promise<boolean>;
}

function ProductCreateForm({
  busy,
  error,
  onSubmit,
  onEdit,
  onCancel,
  view,
  onViewChange,
  flowRef,
  onCleanupError,
  draft,
  updateDraft,
  onBeforeAnalyze,
}: ProductCreateFormProps) {
  const {
    id,
    types,
    values,
    errors,
    image,
    details,
    product,
    changeField,
    validateField,
    handleSubmit,
    reportImageError,
    changeImage,
    removeImage,
    changeFds,
  } = useProductCreateForm({ busy, onEdit, view, draft, updateDraft, onViewChange });

  return (
    <>
      <form
        hidden={!details}
        noValidate
        onSubmit={handleSubmit}
        className={`${details ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col gap-3.5`}
      >
        <ScrollArea
          role="region"
          aria-label="Dados do produto"
          maskHeight={0}
          className="-mx-2 flex min-h-0 flex-1 flex-col"
          viewportClassName="h-auto min-h-0 flex-1 overscroll-contain px-2 py-1 [&>div]:block!"
        >
          <div className="grid min-w-0 items-center gap-6 @min-[650px]:grid-cols-[246px_minmax(0,1fr)] @min-[650px]:gap-[46px]">
            <div className="flex min-w-0 flex-col items-center gap-2">
              <ImageContainer
                shape="rectangle"
                label="Seu produto"
                uploadButtonLabel="Escolher"
                className="w-[180px] @min-[650px]:w-full"
                value={image}
                disabled={busy}
                maxFileSize={MAX_PRODUCT_IMAGE_SIZE}
                onError={reportImageError}
                onChange={changeImage}
              />
              {image && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  disabled={busy}
                  onClick={removeImage}
                >
                  Remover imagem
                </Button>
              )}
            </div>
            <FieldGroup className="grid min-w-0 grid-cols-2 gap-x-[37px] gap-y-5">
              {fields.map(({ name, label, placeholder, maxLength }) => (
                <Field
                  key={name}
                  data-invalid={!!errors[name]}
                  data-disabled={busy}
                  className={
                    name === "nome" || name === "tipo"
                      ? "min-w-0 gap-4"
                      : "col-span-2 min-w-0 gap-4"
                  }
                >
                  <FieldLabel className="text-base" htmlFor={`${id}-${name}`}>
                    {label}
                  </FieldLabel>
                  {name === "tipo" ? (
                    <DropdownControl
                      id={`${id}-${name}`}
                      name={name}
                      value={values.tipo}
                      required
                      disabled={busy || !types.data?.length || types.isFetching}
                      aria-invalid={!!errors.tipo}
                      aria-describedby={errors.tipo ? `${id}-tipo-error` : undefined}
                      placeholder={types.isPending ? "Carregando…" : "Selecione"}
                      options={(types.data ?? []).map((type) => ({
                        value: type,
                        label: type.charAt(0).toUpperCase() + type.slice(1).replaceAll("_", " "),
                      }))}
                      onValueChange={(value) => changeField("tipo", value ?? "")}
                      onBlur={(event) => {
                        if (
                          event.relatedTarget instanceof HTMLElement &&
                          event.relatedTarget.closest('[data-slot="dropdown-popup"]')
                        )
                          return;
                        validateField("tipo");
                      }}
                    />
                  ) : (
                    <ActionInput
                      className="h-16 border-transparent [&_input]:text-base"
                      id={`${id}-${name}`}
                      name={name}
                      value={values[name]}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      disabled={busy}
                      required={name === "nome"}
                      inputMode={name === "codBarras" ? "numeric" : undefined}
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
                      clearLabel={`Limpar ${label.toLowerCase()}`}
                      onClear={() => changeField(name, "")}
                      onChange={(event) => changeField(name, event.target.value)}
                      onBlur={() => validateField(name)}
                    />
                  )}
                  {errors[name] && (
                    <FieldError id={`${id}-${name}-error`}>{errors[name]}</FieldError>
                  )}
                </Field>
              ))}
            </FieldGroup>
          </div>
        </ScrollArea>
        {(types.isError || (!types.isPending && !types.data?.length)) && (
          <div className="flex shrink-0 flex-col items-start gap-2">
            <Button
              type="button"
              variant="link"
              size="sm"
              disabled={types.isFetching}
              onClick={() => {
                void types.refetch();
              }}
            >
              Recarregar tipos
            </Button>
          </div>
        )}
        <div className="flex shrink-0 gap-2.5 pt-3">
          <BasicButton
            size="compact"
            variant="secondary"
            className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar
          </BasicButton>
          <BasicButton
            type="submit"
            size="compact"
            className="min-h-14 min-w-0 flex-1 text-xl leading-[1.2]"
            disabled={
              busy || types.isFetching || !values.nome.trim() || !types.data?.includes(values.tipo)
            }
          >
            {busy && (
              <LoaderCircle
                data-icon="inline-start"
                className="motion-safe:animate-spin"
                aria-hidden="true"
              />
            )}
            Continuar
          </BasicButton>
        </div>
      </form>
      <ProductFdsFlow
        onBeforeAnalyze={onBeforeAnalyze}
        view={view}
        product={product}
        busy={busy}
        error={error}
        flowRef={flowRef}
        onViewChange={onViewChange}
        onSubmit={onSubmit}
        onCleanupError={onCleanupError}
        onEdit={onEdit}
        draft={draft.fds}
        onDraftChange={changeFds}
      />
    </>
  );
}

export default ProductCreateDialog;
