import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useProductRegistrationDraft } from "@/hooks/use-product-registration-draft";
import { create } from "@/services/produto";
import { fdsError } from "@/lib/fds-error";
import { withFinally } from "@/lib/utils/withFinally";
import type { CadastroProdutoForm } from "@/types/Produto";
import type { ProductRegistrationView } from "@/types/ProductRegistration";
import type { FdsFlowHandle } from "@/components/ProductFdsFlow";

interface ProductCreateSessionOptions {
  ownerId: number | null;
  onSaved: (title: string) => void;
  onOutsideError: (message: string) => void;
}

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

export function useProductCreateSession({
  ownerId,
  onSaved,
  onOutsideError,
}: ProductCreateSessionOptions) {
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
  const { sessionVersion, isCurrentCompany } = useAuth();
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
    if (!persisted || !isCurrentCompany(ownerId)) {
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

  function onOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestClose();
      return;
    }
    if (!ready) return;
    for (const notice of toast.toasts) toast.close(notice.id);
    mutation.reset();
    updateDraft({ open: true, view: "details" });
  }
  function edit() {
    if (!saving.current) {
      mutation.reset();
      toast.close("product-create-error");
    }
  }
  async function beforeAnalyze() {
    const persisted = await checkpoint({ ...draft, view: "analyzing" });
    return persisted && isCurrentCompany(ownerId);
  }
  async function confirmCancellation() {
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
  }
  return {
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
  };
}
