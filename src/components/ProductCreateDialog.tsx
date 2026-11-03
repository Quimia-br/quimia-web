import {
  useId,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type RefObject,
  type SyntheticEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LoaderCircle, TriangleAlert, X } from "lucide-react";
import { cn } from "cn";
import { z } from "zod";
import { useAuthStore } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";
import { useProductRegistrationDraft } from "@/hooks/use-product-registration-draft";
import { useProductCreateDialogHandle } from "@/lib/product-create-dialog-context";
import type { ProductRegistrationDraft, UpdateProductDraft } from "@/types/ProductRegistration";
import { ToastProvider, ToastViewport } from "./Toast";
import { create, getTypes } from "@/services/produto";
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
import { fdsError } from "@/lib/fds-error";

import { withFinally } from "@/lib/utils/withFinally";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const schema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(255, "O nome deve ter no máximo 255 caracteres."),
  tipo: z
    .string()
    .trim()
    .min(1, "Informe o tipo do produto.")
    .max(50, "O tipo deve ter no máximo 50 caracteres."),
  descricao: z.string().max(4000, "A descrição deve ter no máximo 4.000 caracteres.").trim(),
  codBarras: z
    .string()
    .max(255, "O código de barras deve ter no máximo 255 dígitos.")
    // The API removes only ASCII spaces; tabs and other control characters are invalid.
    .transform((value) => value.replace(/^ +| +$/g, ""))
    .refine((value) => /^[0-9]*$/.test(value), "Use apenas dígitos no código de barras."),
});
type ProductFields = z.infer<typeof schema>;

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

function creationError(error: unknown) {
  if (axios.isAxiosError(error) && error.message === "invalid_product_creation_response")
    return "O servidor não confirmou o cadastro. Confira a lista de produtos antes de tentar novamente. Seus dados e a FDS foram mantidos.";
  const documentError = fdsError(error);
  if (documentError) return documentError;
  const messages: Record<string, string> = {
    tipo_invalido: "Selecione um tipo de produto válido na lista e tente novamente.",
    produto_ja_cadastrado:
      "Este produto já está cadastrado na sua empresa. Confira o código de barras.",
    codigo_barras_invalido: "O código de barras é inválido. Use apenas dígitos.",
    imagem_muito_grande: "A imagem deve ter no máximo 5 MB. Escolha uma imagem menor.",
    imagem_invalida: "A imagem é inválida. Escolha um arquivo JPEG, PNG ou WebP.",
    armazenamento_imagem_indisponivel:
      "O envio de imagens está indisponível. Tente novamente ou remova a imagem para cadastrar o produto.",
    armazenamento_imagem_falhou:
      "Não foi possível enviar a imagem. Tente novamente ou escolha outra imagem.",
  };
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    const detail = error.response?.data?.detail;
    if (detail && messages[detail]) return messages[detail];
  }
  return "Não foi possível adicionar o produto. Confira os dados e tente novamente.";
}

function ProductCreateDialog({ trigger }: { trigger?: ReactElement }) {
  const pageToast = useToast();
  const handle = useProductCreateDialogHandle();
  const ownerId = useAuthStore((state) => state.user?.id ?? null);
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

function CancelAnalysisDialog({
  open,
  discarding,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;

  discarding: boolean;

  onOpenChange: (open: boolean) => void;

  onConfirm: () => Promise<void>;
}) {
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

async function loadProductTypes(signal: AbortSignal, onError: () => void) {
  try {
    const data = await getTypes(signal);
    if (!data.length) throw new Error("no_product_types");
    return data;
  } catch (failure) {
    if (!axios.isCancel(failure)) onError();

    throw failure;
  }
}

function ProductCreateSession({
  trigger,
  handle,
  ownerId,
  onSaved,
  onOutsideError,
}: {
  trigger?: ReactElement;
  handle: ReturnType<typeof useProductCreateDialogHandle>;
  ownerId: number | null;
  onSaved: (title: string) => void;
  onOutsideError: (message: string) => void;
}) {
  const toast = useToast();
  const {
    draft,
    ready,
    update: updateDraft,
    clear: clearDraft,
    checkpoint,
    recoveryNotice,
  } = useProductRegistrationDraft(ownerId, reportDraftError);
  function reportDraftError(description: string) {
    if (draft.open)
      toast.add({
        id: "product-draft-error",
        type: "error",
        priority: "high",
        title: "Rascunho do produto",
        description,
      });
    else onOutsideError(description);
  }
  const open = draft.open;
  const view = draft.view;
  function setView(view: ProductRegistrationView) {
    updateDraft({ view });
  }
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [preparingSubmission, setPreparingSubmission] = useState(false);
  const flowRef = useRef<FdsFlowHandle>(null);
  const saving = useRef(false);
  const queryClient = useQueryClient();
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const recoveryReported = useRef(false);
  useEffect(() => {
    if (recoveryNotice === "submission" && !recoveryReported.current) {
      recoveryReported.current = true;
      toast.add({
        id: "product-submission-recovery",
        type: "warning",
        priority: "high",
        timeout: 0,
        title: "Confira se o produto foi cadastrado",
        description:
          "A página foi recarregada durante o envio. Confira sua lista antes de tentar novamente. Os dados e arquivos foram mantidos.",
      });
    }
  }, [recoveryNotice, toast]);
  const mutation = useMutation({
    mutationFn: create,
    retry: false,
    onSuccess: ({ situacao }) => {
      void queryClient.invalidateQueries({ queryKey: ["products", sessionVersion] });
      onSaved(
        situacao === "vinculado"
          ? "Produto vinculado com sucesso!"
          : situacao === "reativado"
            ? "Produto reativado com sucesso!"
            : "Produto adicionado com sucesso!",
      );
      clearDraft();
    },
    onError: (failure) => {
      if (!axios.isCancel(failure))
        toast.add({
          id: "product-create-error",
          type: "error",
          priority: "high",
          title: "Não foi possível adicionar o produto",
          description: creationError(failure),
        });
    },
    onSettled: () => {
      saving.current = false;
    },
  });

  async function submit(value: CadastroProdutoForm) {
    if (saving.current) return;
    saving.current = true;
    setPreparingSubmission(true);
    const persisted = await checkpoint({ ...draft, submissionPending: true });
    setPreparingSubmission(false);
    if (!persisted || (useAuthStore.getState().user?.id ?? null) !== ownerId) {
      saving.current = false;
      return;
    }
    mutation.mutate(value);
  }

  function requestClose() {
    if (saving.current || discarding || flowRef.current?.isDiscarding()) return;
    if (flowRef.current?.hasAnalysis()) setConfirmCancel(true);
    else clearDraft();
  }

  function cleanupError() {
    onOutsideError("Não foi possível descartar o PDF temporário. Tente novamente.");
  }

  const reviewing = view === "review" || view === "success";

  const { title, description, width } = registrationViews[view];

  return (
    <>
      <Dialog
        handle={handle}
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            requestClose();
            return;
          }
          if (!ready) return;
          for (const notice of toast.toasts) toast.close(notice.id);
          mutation.reset();
          updateDraft({ open: true, view: "details" });
        }}
      >
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
              onEdit={() => {
                if (!saving.current) {
                  mutation.reset();
                  toast.close("product-create-error");
                }
              }}
              onCancel={requestClose}
              view={view}
              onViewChange={setView}
              flowRef={flowRef}
              onCleanupError={cleanupError}
              draft={draft}
              updateDraft={updateDraft}
              onBeforeAnalyze={async () => {
                const persisted = await checkpoint({ ...draft, view: "analyzing" });
                return persisted && (useAuthStore.getState().user?.id ?? null) === ownerId;
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <CancelAnalysisDialog
        open={confirmCancel}

        discarding={discarding}

        onOpenChange={setConfirmCancel}

        onConfirm={async () => {
          setDiscarding(true);

          await withFinally(
            async () => {
              try {
                await flowRef.current?.discard();
                setConfirmCancel(false);
                clearDraft();
              } catch {
                cleanupError();
              }
            },
            () => setDiscarding(false),
          );
        }}
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
  const id = useId();
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const toast = useToast();
  const types = useQuery({
    queryKey: ["product-types", sessionVersion],

    queryFn: ({ signal }) =>
      loadProductTypes(signal, () => {
        toast.add({
          type: "error",
          priority: "high",
          title: "Não foi possível carregar os tipos de produto",
          description: "Tente novamente para continuar o cadastro.",
        });
      }),

    staleTime: Infinity,
    retry: false,
  });
  const values = draft.fields;
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFields, string>>>({});
  const image = draft.image;
  const details = view === "details";

  const product: CadastroProdutoForm = {
    nome: values.nome.trim(),
    tipo: values.tipo,
    descricao: values.descricao.trim() || undefined,
    codBarras: values.codBarras.trim() || undefined,
    imagem: image ?? undefined,
  };

  function changeField(name: keyof ProductFields, value: string) {
    updateDraft((current) => ({ ...current, fields: { ...current.fields, [name]: value } }));
    if (errors[name]) validateField(name, value);
    onEdit();
  }

  function validateField(name: keyof ProductFields, value?: string) {
    const result = schema.shape[name].safeParse(value ?? values[name]);
    setErrors((current) => ({
      ...current,
      [name]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(
        Object.fromEntries(
          result.error.issues.toReversed().map((issue) => [issue.path[0], issue.message]),
        ),
      );
      const firstField = result.error.issues[0]?.path[0];
      if (firstField)
        event.currentTarget
          .querySelector<HTMLElement>(`[id="${id}-${String(firstField)}"]`)
          ?.focus();
      return;
    }
    if (!types.data?.includes(result.data.tipo)) {
      setErrors({ tipo: "Selecione um tipo de produto válido." });
      event.currentTarget.querySelector<HTMLElement>(`[id="${id}-tipo"]`)?.focus();
      return;
    }
    updateDraft({ fields: result.data });
    onViewChange("upload");
  }

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
                maxFileSize={MAX_IMAGE_SIZE}
                onError={(description) =>
                  toast.add({
                    type: "error",
                    priority: "high",
                    title: "Não foi possível usar a imagem",
                    description,
                  })
                }
                onChange={(file) => {
                  if (file && file.size > MAX_IMAGE_SIZE) {
                    toast.add({
                      type: "error",
                      priority: "high",
                      title: "A imagem deve ter no máximo 5 MB",
                      description: "Escolha uma imagem menor.",
                    });
                    return;
                  }
                  updateDraft({ image: file });
                  onEdit();
                }}
              />
              {image && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  disabled={busy}
                  onClick={() => {
                    updateDraft({ image: null });
                    onEdit();
                  }}
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
        onDraftChange={(patch) =>
          updateDraft((current) => ({
            ...current,
            fds: typeof patch === "function" ? patch(current.fds) : { ...current.fds, ...patch },
          }))
        }
      />
    </>
  );
}

export default ProductCreateDialog;
