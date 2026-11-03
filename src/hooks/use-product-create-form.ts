import { useId, useState, type SyntheticEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getTypes } from "@/services/produto";
import type { CadastroProdutoForm } from "@/types/Produto";
import type {
  ProductFields,
  ProductFdsDraft,
  ProductRegistrationDraft,
  ProductRegistrationView,
  UpdateProductDraft,
} from "@/types/ProductRegistration";
import { productCreateFormSchema } from "@/lib/utils/product-form-validation";

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
interface ProductCreateFormOptions {
  busy: boolean;
  onEdit: () => void;
  view: ProductRegistrationView;
  draft: ProductRegistrationDraft;
  updateDraft: UpdateProductDraft;
  onViewChange: (view: ProductRegistrationView) => void;
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

export function useProductCreateForm({
  busy,
  onEdit,
  view,
  draft,
  updateDraft,
  onViewChange,
}: ProductCreateFormOptions) {
  const id = useId();
  const { sessionVersion } = useAuth();
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
    const result = productCreateFormSchema.shape[name].safeParse(value ?? values[name]);
    setErrors((current) => ({
      ...current,
      [name]: result.success ? undefined : result.error.issues[0]?.message,
    }));
  }

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const result = productCreateFormSchema.safeParse(values);
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

  function reportImageError(description: string) {
    toast.add({
      type: "error",
      priority: "high",
      title: "Não foi possível usar a imagem",
      description,
    });
  }
  function changeImage(file: File | null) {
    if (file && file.size > MAX_PRODUCT_IMAGE_SIZE) {
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
  }
  function removeImage() {
    updateDraft({ image: null });
    onEdit();
  }
  function changeFds(
    patch: Partial<ProductFdsDraft> | ((draft: ProductFdsDraft) => ProductFdsDraft),
  ) {
    updateDraft((current) => ({
      ...current,
      fds: typeof patch === "function" ? patch(current.fds) : { ...current.fds, ...patch },
    }));
  }
  return {
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
  };
}
