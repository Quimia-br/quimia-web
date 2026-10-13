import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { withFinally } from "@/lib/utils/withFinally";
import Cropper, { type Area } from "react-easy-crop";
import { Check, Grid2X2, LoaderCircle } from "lucide-react";
import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useImagePreview } from "@/hooks/use-image-preview";
import { getCroppedImg } from "@/lib/utils/getCroppedImg";
import { IMAGE_ASPECT_RATIOS, type ImageShape, type ImageValue } from "@/types/Image";
import BasicButton from "./BasicButton";

export interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: ImageValue;
  onSave: (file: File) => void | Promise<void>;
  shape?: ImageShape;
  maxOutputSize?: number;
  defaultGrid?: boolean;
  className?: string;
}

function ImageEditor({ open, onOpenChange, image, onSave, shape = "rectangle", maxOutputSize = 2048,
  defaultGrid = true, className }: ImageEditorProps) {
  const imageSrc = useImagePreview(open ? image : null);
  const savingRef = useRef(false);
  return (
    <Dialog open={open && !!imageSrc} onOpenChange={(nextOpen) => {
      if (!savingRef.current) onOpenChange(nextOpen);
    }}>
      {open && imageSrc && <EditorSession key={`${imageSrc}:${shape}`} imageSrc={imageSrc}
        fileName={image instanceof File ? image.name : "imagem-recortada"} shape={shape}
        maxOutputSize={maxOutputSize} defaultGrid={defaultGrid} className={className}
        savingRef={savingRef} onSave={onSave} onClose={() => onOpenChange(false)} />}
    </Dialog>
  );
}

interface EditorSessionProps {
  imageSrc: string;
  fileName: string;
  shape: ImageShape;
  maxOutputSize: number;
  defaultGrid: boolean;
  className?: string;
  savingRef: RefObject<boolean>;
  onSave: ImageEditorProps["onSave"];
  onClose: () => void;
}

function EditorSession({ imageSrc, fileName, shape, maxOutputSize, defaultGrid, className,
  savingRef, onSave, onClose }: EditorSessionProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [grid, setGrid] = useState(defaultGrid);
  const [area, setArea] = useState<Area | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropSize, setCropSize] = useState<{ width: number; height: number }>();
  const frame = useRef<HTMLDivElement>(null);
  const pending = useRef<AbortController | null>(null);
  const zoomLabelId = useId();

  useEffect(() => {
    return () => { pending.current?.abort(); savingRef.current = false; };
  }, [savingRef]);

  useEffect(() => {
    if (!frame.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setCropSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => setError("A imagem não carregou. Cancele e tente escolher outro arquivo."), 15000);
    return () => clearTimeout(timer);
  }, [ready]);

  async function confirmCrop() {
    if (!ready || !area || savingRef.current) return;
    const controller = new AbortController();
    pending.current = controller;
    savingRef.current = true;
    setBusy(true);
    setError(null);
    await withFinally(async () => {
    try {
      const { file } = await getCroppedImg(imageSrc, area, { fileName, maxSize: maxOutputSize, signal: controller.signal });
      if (controller.signal.aborted) return;
      await onSave(file);
      if (!controller.signal.aborted) onClose();
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Não foi possível salvar a imagem. Tente novamente.");
    }
    }, () => {
      if (!controller.signal.aborted) { savingRef.current = false; setBusy(false); }
    });
  }

  return (
    <DialogContent showCloseButton={false} aria-busy={busy}
      className={cn("max-h-[calc(100dvh-2rem)] w-[310px] max-w-[calc(100%-2rem)] gap-6 overflow-y-auto rounded-[32px] bg-surface-base p-8 sm:max-w-[310px] data-open:zoom-in-100 data-closed:zoom-out-100", className)}>
      <DialogTitle className="sr-only">Editar imagem</DialogTitle>
      <DialogDescription className="sr-only">Arraste a imagem para ajustar o enquadramento ou use as setas do teclado. Ajuste o zoom e confirme o recorte.</DialogDescription>
      <div ref={frame} className={cn("relative isolate w-full overflow-hidden bg-secondary-primary",
        shape === "circle" ? "aspect-square rounded-full" : "aspect-[246/388] rounded-[32px]")}>
        <Cropper image={imageSrc} crop={crop} zoom={zoom} minZoom={1} maxZoom={4}
          aspect={IMAGE_ASPECT_RATIOS[shape]} cropSize={cropSize} cropShape={shape === "circle" ? "round" : "rect"}
          objectFit="cover" showGrid={grid} zoomWithScroll={false} roundCropAreaPixels
          onCropChange={(next) => { if (!savingRef.current) setCrop(next); }}
          onZoomChange={(next) => { if (!savingRef.current) setZoom(next); }}
          onCropAreaChange={(_, pixels) => setArea(pixels)}
          onMediaLoaded={() => { setReady(true); setError(null); }}
          mediaProps={{ crossOrigin: "anonymous", alt: "Imagem para recorte", onError: () => {
            setReady(false); setError("Não foi possível carregar a imagem para edição. Cancele e tente carregar um arquivo do seu dispositivo.");
          } }}
          style={{ containerStyle: busy ? { pointerEvents: "none" } : undefined }}
          cropperProps={{ "aria-label": "Área de recorte da imagem", "aria-disabled": busy, tabIndex: busy ? -1 : 0,
            onKeyDownCapture: (event) => { if (savingRef.current) { event.preventDefault(); event.stopPropagation(); } } }}
        />
        {!ready && !error && <div role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" />
          <span className="sr-only">Carregando imagem</span>
        </div>}
      </div>
      <div className="flex h-[50px] flex-col justify-between gap-3">
        <span id={zoomLabelId} className="sr-only">Zoom da imagem</span>
        <Slider aria-labelledby={zoomLabelId} value={[zoom]} min={1} max={4} step={0.01}
          disabled={!ready || busy} onValueChange={(next) => setZoom(Array.isArray(next) ? next[0] : next)}
          className="py-3 [&_[data-slot=slider-thumb]]:h-7 [&_[data-slot=slider-thumb]]:w-12" />
      </div>
      {error && <p role="alert" className="rounded-xl bg-feedback-error/15 p-3 text-sm text-foreground-primary">{error}</p>}
      <div className="flex items-center gap-2.5">
        <BasicButton variant="secondary" size="compact" className="min-h-[50px] min-w-0 flex-1 px-3" disabled={busy} onClick={onClose}>Cancelar</BasicButton>
        <Button type="button" variant="secondary" size="icon-sm" className={cn("size-[50px] rounded-full", grid && "bg-secondary-secondary")}
          aria-label={grid ? "Ocultar grade" : "Mostrar grade"} aria-pressed={grid} disabled={busy} onClick={() => setGrid(!grid)}>
          <Grid2X2 className="size-6" aria-hidden="true" />
        </Button>
        <Button type="button" size="icon-sm" className="size-[50px] rounded-full" aria-label="Confirmar recorte"
          aria-busy={busy} disabled={!ready || !area || busy} onClick={confirmCrop}>
          {busy ? <LoaderCircle className="size-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Check className="size-6" aria-hidden="true" />}
        </Button>
      </div>
      {busy && <span role="status" className="sr-only">Salvando imagem</span>}
    </DialogContent>
  );
}

export default ImageEditor;
