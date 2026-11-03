import { useId, useRef, useState, type SyntheticEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { getTypes, remove, update } from "@/services/produto";
import type { AlteracaoProdutoForm } from "@/types/Produto";
import type { ProductFields as Fields } from "@/types/ProductRegistration";
import type { ProductAction } from "@/components/ProductActionDialog";
import { productActionFormSchema } from "@/utils/product-form-validation";

const fieldNames = ["nome", "tipo", "descricao", "codBarras"] as const;
interface ProductActionOptions {
  action: ProductAction;
  onClose: () => void;
}
function errorMessage(error: unknown, editing: boolean) {
  if (isAxiosError<{ detail?: string }>(error)) {
    const messages: Record<string, string> = {
      produto_compartilhado:
        "Este produto é compartilhado com outra empresa e não pode ser editado.",
      cod_barras_em_uso: "O código de barras já está sendo usado por outro produto.",
      codigo_barras_invalido:
        "O código de barras é inválido. Confira os dígitos e tente novamente.",
      tipo_invalido: "Selecione um tipo de produto válido.",
      produto_nao_encontrado:
        "Este produto não está mais vinculado à sua empresa. Atualize a lista.",
    };
    const detail = error.response?.data?.detail;
    if (detail && messages[detail]) return messages[detail];
  }
  return editing
    ? "Não foi possível salvar as alterações. Confira os dados e tente novamente."
    : "Não foi possível excluir o produto. Tente novamente.";
}

export function useProductAction({ action, onClose }: ProductActionOptions) {
  const { product, mode } = action;
  const editing = mode === "edit";
  const id = useId();
  const saving = useRef(false);
  const client = useQueryClient();
  const toast = useToast();
  const { sessionVersion, isCurrentSession } = useAuth();
  const [values, setValues] = useState<Fields>({
    nome: product.nome,
    tipo: product.tipo ?? "",
    descricao: product.descricao ?? "",
    codBarras: product.codBarras ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const types = useQuery({
    queryKey: ["product-types", sessionVersion],
    queryFn: ({ signal }) => getTypes(signal),
    enabled: editing,
    retry: false,
  });
  const mutation = useMutation({
    retry: false,
    mutationFn: async (changes: AlteracaoProdutoForm) => {
      if (editing) await update(product.id, changes);
      else await remove(product.id);
    },
    onSuccess: () => {
      if (!isCurrentSession(sessionVersion)) return;
      void client.invalidateQueries({ queryKey: ["products", sessionVersion] });
      void client.invalidateQueries({ queryKey: ["product-detail", sessionVersion, product.id] });
      toast.add({
        type: "success",
        title: editing ? "Produto atualizado com sucesso!" : "Produto excluído com sucesso!",
      });
      onClose();
    },
    onSettled: () => {
      saving.current = false;
    },
  });

  function submit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    if (saving.current) return;
    let changes: AlteracaoProdutoForm = {};
    if (editing) {
      const result = productActionFormSchema.safeParse(values);
      const nextErrors: Partial<Record<keyof Fields, string>> = {};
      if (!result.success) {
        for (const issue of result.error.issues) {
          const field = issue.path[0] as keyof Fields;
          if (nextErrors[field] == null) nextErrors[field] = issue.message;
        }
      } else if (result.data.tipo !== product.tipo && !types.data?.includes(result.data.tipo)) {
        nextErrors.tipo = "Selecione um tipo de produto válido.";
      }
      setErrors(nextErrors);
      const firstField = fieldNames.find((name) => nextErrors[name]);
      if (firstField) {
        document.getElementById(`${id}-${firstField}`)?.focus();
        return;
      }
      if (!result.success) return;
      // PATCH only changed fields so legacy empty values are preserved as stored.
      for (const name of fieldNames) {
        if (result.data[name] !== (product[name] ?? "")) changes[name] = result.data[name];
      }
      if (!Object.keys(changes).length) {
        onClose();
        return;
      }
    }
    saving.current = true;
    mutation.mutate(changes);
  }

  function onOpenChange(open: boolean) {
    if (!open && !saving.current) onClose();
  }
  function changeField(name: keyof Fields, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }
  return {
    editing,
    id,
    values,
    errors,
    types,
    mutation,
    submit,
    onOpenChange,
    changeField,
    error: mutation.isError ? errorMessage(mutation.error, editing) : null,
  };
}
