import { useId, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { BookImage, Upload, Maximize, Pencil } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { useImagePreview } from "@/hooks/use-image-preview";
import type { ImageShape, ImageValue } from "@/types/Image";
import BasicButton from "./BasicButton";
import ImageEditor from "./ImageEditor";

export interface ImageContainerProps {
  shape?: ImageShape;
  value?: ImageValue;
  onChange: (file: File | null) => void | Promise<void>;
  label?: string;
  uploadButtonLabel?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  /** Maximum selected file size in bytes. Defaults to 10 MB. */
  maxFileSize?: number;
  error?: string;
  onError?: (message: string) => void;
}

function rejectionMessage(rejections: FileRejection[], maxSize: number) {
  const codes = rejections.flatMap(({ errors }) => errors.map(({ code }) => code));
  if (codes.includes("file-too-large")) {
    const limit = (maxSize / 1024 / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
    return `O arquivo excede o limite de tamanho (${limit} MB). Escolha uma imagem menor.`;
  }
  if (codes.includes("too-many-files")) return "Escolha apenas uma imagem por vez.";
  return "Formato não suportado. Escolha uma imagem JPEG, PNG ou WebP.";
}

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function ImagePlaceholder({ shape, label }: { shape: ImageShape; label: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col items-center justify-center gap-2",
        shape === "circle" ? "-translate-y-8" : "-translate-y-4",
      )}
    >
      <div className="flex aspect-[10/9] w-[min(100px,40%)] items-center justify-center rounded-full bg-secondary-primary">
        <BookImage className="size-8" aria-hidden="true" />
      </div>
      <span
        className={cn(
          "max-w-[calc(100%-2rem)] text-center text-base font-medium break-words",
          shape === "circle" && "sr-only",
        )}
      >
        {label}
      </span>
    </div>
  );
}

interface ImageActionsProps {
  shape: ImageShape;
  label: string;
  uploadButtonLabel?: string;
  showImage: boolean;
  previewFailed: boolean;
  isDragAccept: boolean;
  isDragReject: boolean;
  onEdit: () => void;
  onReplace: () => void;
}

function ImageActions({
  shape,
  label,
  uploadButtonLabel,
  showImage,
  previewFailed,
  isDragAccept,
  isDragReject,
  onEdit,
  onReplace,
}: ImageActionsProps) {
  if (showImage) {
    return (
      <div
        className={cn(
          "absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-150 motion-reduce:transition-none group-hover/image:opacity-100 group-focus-within/image:opacity-100 [@media(hover:none)]:opacity-100",
          (isDragAccept || isDragReject) && "opacity-100",
        )}
      >
        <div
          className={cn(
            "absolute flex items-center gap-3",
            shape === "circle"
              ? "inset-0 flex-col justify-center -translate-y-3"
              : "inset-x-4 bottom-5 flex-row-reverse",
          )}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon-sm"
            className="size-[50px] rounded-full"
            aria-label={`Editar enquadramento de ${label}`}
            onClick={onEdit}
          >
            <Maximize className="size-6" aria-hidden="true" />
          </Button>
          <BasicButton
            variant="secondary"
            size="compact"
            icon={<Pencil />}
            className={cn("min-h-[50px]", shape === "circle" ? "w-[150px]" : "flex-1 px-3")}
            aria-label={`Alterar imagem de ${label}`}
            onClick={onReplace}
          >
            Alterar
          </BasicButton>
        </div>
      </div>
    );
  }

  const uploadLabel = `${previewFailed ? "Alterar" : "Carregar"} imagem de ${label}`;
  if (shape === "circle") {
    return (
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        className="absolute bottom-8 left-1/2 size-11 -translate-x-1/2 rounded-full"
        aria-label={uploadLabel}
        onClick={onReplace}
      >
        <Upload className="size-6" aria-hidden="true" />
      </Button>
    );
  }
  return (
    <BasicButton
      variant="secondary"
      size="compact"
      icon={<Upload />}
      className="absolute inset-x-4 bottom-5 min-h-[50px] w-auto px-3"
      aria-label={uploadLabel}
      onClick={onReplace}
    >
      {previewFailed ? "Alterar imagem" : (uploadButtonLabel ?? "Carregar arquivo")}
    </BasicButton>
  );
}

function useImageSelection(
  value: ImageValue,
  editable: boolean,
  maxFileSize: number,
  onError?: (message: string) => void,
) {
  const [draft, setDraft] = useState<{ image: File | string; originalValue: ImageValue } | null>(
    null,
  );
  const [issue, setIssue] = useState<{ value: ImageValue; message: string } | null>(null);
  // A newly received API value invalidates the previous editing session.
  if (draft && (draft.originalValue !== value || !editable)) setDraft(null);
  const session = editable && draft?.originalValue === value ? draft : null;
  const { getRootProps, getInputProps, open, isDragAccept, isDragReject } = useDropzone({
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"], "image/webp": [".webp"] },
    maxSize: maxFileSize,
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    disabled: !editable || !!session,
    onDrop(files, rejections) {
      if (rejections.length) {
        const message = rejectionMessage(rejections, maxFileSize);
        if (onError) onError(message);
        else setIssue({ value, message });
      } else if (files[0]) {
        setIssue(null);
        setDraft({ image: files[0], originalValue: value });
      }
    },
  });
  const replaceImage = () => {
    setIssue(null);
    open();
  };
  const editImage = () => setDraft(value ? { image: value, originalValue: value } : null);
  const closeSession = () => setDraft((current) => (current === session ? null : current));
  return {
    session,
    issue,
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
    replaceImage,
    editImage,
    closeSession,
  };
}

function imageMessage(
  error: string | undefined,
  issue: { value: ImageValue; message: string } | null,
  value: ImageValue,
  previewFailed: boolean,
) {
  if (error) return error;
  if (issue?.value === value) return issue.message;
  return previewFailed ? "Não foi possível carregar a imagem. Tente substituir o arquivo." : null;
}

export function ImageContainer({
  shape = "circle",
  value = null,
  onChange,
  label = "Imagem",
  uploadButtonLabel,
  className,
  disabled = false,
  readOnly = false,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  error,
  onError,
}: ImageContainerProps) {
  const previewUrl = useImagePreview(value);
  const [failedPreview, setFailedPreview] = useState<string | null>(null);
  const errorId = useId();
  const inputId = useId();
  const editable = !disabled && !readOnly;
  const {
    session,
    issue,
    getRootProps,
    getInputProps,
    isDragAccept,
    isDragReject,
    replaceImage,
    editImage,
    closeSession,
  } = useImageSelection(value, editable, maxFileSize, onError);
  const previewFailed = !!previewUrl && failedPreview === previewUrl;
  const message = imageMessage(error, issue, value, previewFailed);
  const showImage = previewUrl && !previewFailed;

  return (
    <div className={cn("w-[246px] max-w-full min-w-0", className)}>
      <div
        {...getRootProps({
          role: "group",
          "aria-label": label,
          "aria-describedby": message && !onError ? errorId : undefined,
        })}
        className={cn(
          "group/image relative isolate overflow-hidden bg-surface-base text-foreground-primary",
          shape === "circle" ? "aspect-square rounded-full" : "aspect-[246/388] rounded-[32px]",
          isDragAccept && "ring-3 ring-ring",
          isDragReject && "ring-3 ring-destructive",
        )}
      >
        {editable && (
          <>
            <label htmlFor={inputId} className="sr-only">{`Carregar imagem de ${label}`}</label>
            <input {...getInputProps({ id: inputId })} />
          </>
        )}
        {showImage ? (
          <img
            src={previewUrl}
            alt={label}
            draggable={false}
            onError={() => {
              setFailedPreview(previewUrl);
              onError?.("Não foi possível carregar a imagem. Tente substituir o arquivo.");
            }}
            className="absolute hover:blur-[1px] inset-0 size-full object-cover select-none"
          />
        ) : (
          <ImagePlaceholder shape={shape} label={label} />
        )}
        {editable && (
          <ImageActions
            shape={shape}
            label={label}
            uploadButtonLabel={uploadButtonLabel}
            showImage={!!showImage}
            previewFailed={previewFailed}
            isDragAccept={isDragAccept}
            isDragReject={isDragReject}
            onEdit={editImage}
            onReplace={replaceImage}
          />
        )}
      </div>
      {message && !onError && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 rounded-xl bg-feedback-error/15 p-3 text-sm text-foreground-primary"
        >
          {message}
        </p>
      )}
      <ImageEditor
        open={!!session}
        image={session?.image ?? null}
        shape={shape}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeSession();
        }}
        onSave={async (file) => {
          await onChange(file);
        }}
      />
    </div>
  );
}

// Keep existing screens using the original Portuguese export working.
export { ImageContainer as ImagemContainer };
