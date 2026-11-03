import { useId, useRef, useState, type SyntheticEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { z } from "zod";
import { useAuthStore } from "@/lib/auth-token";
import { useToast } from "@/hooks/use-toast";
import { getTypes, remove, update } from "@/services/produto";
import type { AlteracaoProdutoForm, Produto } from "@/types/Produto";
import { textSchema } from "@/utils/validation";
import ActionInput from "./ActionInput";
import BasicButton from "./BasicButton";
import { DropdownControl } from "./Dropdown";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "./ui/field";
import { Textarea } from "./ui/textarea";

export interface ProductAction {
  mode: "edit" | "delete";
  product: Produto;
  trigger: HTMLElement;
}

const schema = z.object({
  nome: textSchema(255, 2),
  tipo: textSchema(50, 1),
  descricao: textSchema(4000, 0, true),
  codBarras: textSchema(255).refine(
    (value) => /^\d*$/.test(value),
    "Use apenas dígitos no código de barras.",
  ),
});
type Fields = z.infer<typeof schema>;
const fields = [
  { name: "nome", label: "Nome", maxLength: 255 },
  { name: "tipo", label: "Tipo", maxLength: 50 },
  { name: "descricao", label: "Descrição", maxLength: 4000 },
  { name: "codBarras", label: "Código de barras", maxLength: 255 },
] as const;

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

export default function ProductActionDialog({
  action,
  onClose,
}: {
  action: ProductAction;
  onClose: () => void;
}) {
  const { product, mode, trigger } = action;
  const editing = mode === "edit";
  const id = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const saving = useRef(false);
  const client = useQueryClient();
  const toast = useToast();
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
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
      if (useAuthStore.getState().sessionVersion !== sessionVersion) return;
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
      const result = schema.safeParse(values);
      const nextErrors: Partial<Record<keyof Fields, string>> = {};
      if (!result.success) {
        for (const issue of result.error.issues)
          nextErrors[issue.path[0] as keyof Fields] ??= issue.message;
      } else if (result.data.tipo !== product.tipo && !types.data?.includes(result.data.tipo)) {
        nextErrors.tipo = "Selecione um tipo de produto válido.";
      }
      setErrors(nextErrors);
      const firstField = fields.find((field) => nextErrors[field.name]);
      if (firstField) {
        document.getElementById(`${id}-${firstField.name}`)?.focus();
        return;
      }
      if (!result.success) return;
      // PATCH only changed fields so legacy empty values are preserved as stored.
      for (const { name } of fields) {
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

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving.current) onClose();
      }}
    >
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[32px] bg-secondary p-6 sm:max-w-lg sm:p-8"
        showCloseButton={!mutation.isPending}
        initialFocus={editing ? undefined : cancelRef}
        finalFocus={() => (trigger.isConnected ? trigger : false)}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Editar produto" : "Excluir produto"}</DialogTitle>
          <DialogDescription className="wrap-anywhere">
            {editing
              ? `Atualize os dados de ${product.nome}.`
              : `Excluir ${product.nome} da lista de produtos da sua empresa? Esta ação remove o vínculo com a sua empresa.`}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={submit}
          noValidate
          className="flex min-w-0 flex-col gap-6"
          aria-busy={mutation.isPending}
        >
          {editing && (
            <FieldGroup>
              {fields.map(({ name, label, maxLength }) => (
                <Field key={name} data-invalid={!!errors[name]}>
                  <FieldLabel htmlFor={`${id}-${name}`}>{label}</FieldLabel>
                  {name === "tipo" ? (
                    <DropdownControl
                      id={`${id}-${name}`}
                      value={values.tipo}
                      disabled={mutation.isPending || types.isPending || types.isError}
                      options={[
                        ...new Set([
                          ...(types.data ?? []),
                          ...(product.tipo ? [product.tipo] : []),
                        ]),
                      ].map((value) => ({ value, label: value.replaceAll("_", " ") }))}
                      onValueChange={(value) =>
                        setValues((current) => ({ ...current, tipo: value ?? "" }))
                      }
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
                    />
                  ) : name === "descricao" ? (
                    <Textarea
                      id={`${id}-${name}`}
                      value={values.descricao}
                      maxLength={maxLength}
                      disabled={mutation.isPending}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, descricao: event.target.value }))
                      }
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
                    />
                  ) : (
                    <ActionInput
                      id={`${id}-${name}`}
                      value={values[name]}
                      maxLength={maxLength}
                      clearLabel={`Limpar ${label.toLowerCase()}`}
                      disabled={mutation.isPending}
                      inputMode={name === "codBarras" ? "numeric" : undefined}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [name]: event.target.value }))
                      }
                      onClear={() => setValues((current) => ({ ...current, [name]: "" }))}
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
                    />
                  )}
                  {errors[name] && (
                    <FieldError id={`${id}-${name}-error`}>{errors[name]}</FieldError>
                  )}
                </Field>
              ))}
              {types.isError && (
                <div role="alert">
                  Não foi possível carregar os tipos.{" "}
                  <BasicButton
                    size="compact"
                    variant="secondary"
                    onClick={() => void types.refetch()}
                  >
                    Tentar novamente
                  </BasicButton>
                </div>
              )}
            </FieldGroup>
          )}
          {mutation.isError && <p role="alert">{errorMessage(mutation.error, editing)}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <BasicButton
              ref={cancelRef}
              variant="secondary"
              size="compact"
              disabled={mutation.isPending}
              onClick={onClose}
            >
              Cancelar
            </BasicButton>
            <BasicButton
              type="submit"
              variant={editing ? "primary" : "critical"}
              size="compact"
              disabled={mutation.isPending}
            >
              {mutation.isPending
                ? editing
                  ? "Salvando…"
                  : "Excluindo…"
                : editing
                  ? "Salvar alterações"
                  : "Excluir produto"}
            </BasicButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
