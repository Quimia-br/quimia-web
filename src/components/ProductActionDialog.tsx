import { useProductAction } from "@/hooks/use-product-action";
import { useRef } from "react";
import type { Produto } from "@/types/Produto";
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

const fields = [
  { name: "nome", label: "Nome", maxLength: 255 },
  { name: "tipo", label: "Tipo", maxLength: 50 },
  { name: "descricao", label: "Descrição", maxLength: 4000 },
  { name: "codBarras", label: "Código de barras", maxLength: 255 },
] as const;

interface ProductActionDialogProps {
  action: ProductAction;
  onClose: () => void;
}

export default function ProductActionDialog({ action, onClose }: ProductActionDialogProps) {
  const { product, trigger } = action;
  const cancelRef = useRef<HTMLButtonElement>(null);
  const { editing, id, values, errors, types, mutation, submit, onOpenChange, changeField, error } =
    useProductAction({ action, onClose });

  return (
    <Dialog open onOpenChange={onOpenChange}>
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
                      onValueChange={(value) => changeField("tipo", value ?? "")}
                      aria-invalid={!!errors[name]}
                      aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
                    />
                  ) : name === "descricao" ? (
                    <Textarea
                      id={`${id}-${name}`}
                      value={values.descricao}
                      maxLength={maxLength}
                      disabled={mutation.isPending}
                      onChange={(event) => changeField("descricao", event.target.value)}
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
                      onChange={(event) => changeField(name, event.target.value)}
                      onClear={() => changeField(name, "")}
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
          {error && <p role="alert">{error}</p>}
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
