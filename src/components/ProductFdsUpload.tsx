import { useId, useRef, useState } from "react";
import { Check, FileText, Trash2, Upload } from "lucide-react";
import { cn } from "cn";
import type { CadastroProdutoForm } from "@/types/Produto";
import { useImagePreview } from "@/hooks/use-image-preview";
import ProductImage from "./ProductImage";
import BasicButton from "./BasicButton";
import { Button } from "./ui/button";

interface Props {
  file: File | null;
  disabled: boolean;
  onSelect: (file: File) => Promise<void>;
  onRemove: () => void;
  replace?: boolean;
}

export function FdsFilePicker({ file, disabled, onSelect, onRemove, replace }: Props) {
  const id = useId();
  const picker = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-4 py-6">
      <input
        ref={picker}
        id={id}
        type="file"
        accept="application/pdf,.pdf"
        aria-label="Arquivo PDF da FDS"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.files?.[0];
          event.target.value = "";
          if (next) void onSelect(next);
        }}
      />
      {file ? (
        <div className="flex w-full max-w-[322px] flex-col gap-6 rounded-[32px] bg-surface-base px-8 py-6">
          <div className="flex min-w-0 items-center gap-4">
            <FileText className="size-6 shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 truncate text-[15px]" title={file.name}>
              {file.name}
            </p>
            <Check className="size-6 shrink-0" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-6">
            <BasicButton
              size="compact"
              variant="secondary"
              className="min-h-[42px] min-w-0 flex-1 text-sm leading-[1.2]"
              disabled={disabled}
              onClick={() => picker.current?.click()}
            >
              Alterar
            </BasicButton>
            <Button
              type="button"
              variant="critical"
              size="icon-tiny"
              className="size-[42px] rounded-full"
              disabled={disabled}
              aria-label="Remover FDS"
              onClick={onRemove}
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => picker.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!disabled && event.dataTransfer.files[0])
              void onSelect(event.dataTransfer.files[0]);
          }}
          className={cn(
            "flex min-h-[191px] w-full items-center justify-center gap-6 rounded-[48px] border-3 border-dashed bg-surface-base p-6 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-50",
            dragging ? "border-brand-accent" : "border-secondary-hover",
          )}
        >
          <span className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-primary-primary text-primary-foreground">
            <Upload className="size-5" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col gap-3">
            <span className="text-base font-medium">Adicionar arquivo</span>
            <span className="text-sm text-muted-foreground">Tipos permitidos: PDF · até 10 MB</span>
          </span>
        </button>
      )}
      {replace && file && (
        <p className="text-sm text-muted-foreground">
          O documento será analisado antes de continuar.
        </p>
      )}
    </div>
  );
}

export function FdsProductPreview({ product }: { product: CadastroProdutoForm }) {
  const preview = useImagePreview(product.imagem ?? null);
  return (
    <article
      aria-label="Prévia do produto"
      className="flex min-w-0 flex-col justify-between rounded-[42px] bg-surface-base p-8 @min-[720px]:h-[438px]"
    >
      <div className="flex flex-col gap-1.5">
        <p className="break-words text-2xl leading-[1.2] font-medium">{product.nome}</p>
        <p className="text-lg leading-[1.2] text-muted-foreground">
          {product.tipo.replaceAll("_", " ")}
        </p>
      </div>
      <ProductImage
        product={{ nome: product.nome, fotoUrl: preview }}
        className="mx-auto h-[229px] w-full [&_img]:object-center"
      />
      {product.descricao && (
        <div className="flex flex-col gap-2.5 pt-4">
          <p className="text-sm leading-none">Descrição</p>
          <p className="line-clamp-3 whitespace-pre-wrap break-words text-xs leading-none text-muted-foreground">
            {product.descricao}
          </p>
        </div>
      )}
    </article>
  );
}
