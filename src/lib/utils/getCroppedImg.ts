import type { Area } from "react-easy-crop";

export interface CropImageOptions {
  fileName?: string;
  /** Maximum output edge in natural pixels, independent of screen density. */
  maxSize?: number;
  signal?: AbortSignal;
}

const remoteImageError = "Não foi possível carregar a imagem. Para editar uma imagem remota, a URL precisa estar acessível e permitir CORS. Tente carregar um arquivo do seu dispositivo.";

function createImage(url: string, signal?: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const image = new Image();
    const timer = setTimeout(() => finish(new Error(remoteImageError)), 15000);
    const cleanup = () => {
      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;
      signal?.removeEventListener("abort", abort);
    };
    const finish = (error?: Error) => {
      cleanup();
      if (error) reject(error);
      else resolve(image);
    };
    const abort = () => {
      finish(new DOMException("Edição cancelada", "AbortError"));
      image.src = "";
    };
    image.crossOrigin = "anonymous";
    image.onload = () => finish();
    image.onerror = () => finish(new Error(remoteImageError));
    signal?.addEventListener("abort", abort, { once: true });
    image.src = url;
  });
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  { fileName = "imagem-recortada", maxSize = 2048, signal }: CropImageOptions = {},
): Promise<{ file: File }> {
  signal?.throwIfAborted();
  const { x, y, width, height } = pixelCrop;
  if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width < 1 || height < 1) {
    throw new Error("O recorte da imagem é inválido. Ajuste o enquadramento e tente novamente.");
  }
  if (!Number.isFinite(maxSize) || maxSize < 1) throw new Error("O tamanho máximo do recorte é inválido.");

  const image = await createImage(imageSrc, signal);
  signal?.throwIfAborted();
  if (x + width > image.naturalWidth || y + height > image.naturalHeight) {
    throw new Error("O recorte está fora dos limites da imagem.");
  }

  const scale = Math.min(1, maxSize / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível processar a imagem neste navegador.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("Edição cancelada", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    try {
      canvas.toBlob((blob) => {
        signal?.removeEventListener("abort", abort);
        if (signal?.aborted) return;
        if (!blob) {
          reject(new Error("Não foi possível gerar o arquivo. Tente novamente."));
          return;
        }
        const extension = blob.type === "image/png" ? "png" : blob.type === "image/jpeg" ? "jpg" : "webp";
        const baseName = fileName.replace(/\.[^.]+$/, "").replace(/[\\/]/g, "_") || "imagem-recortada";
        resolve({ file: new File([blob], baseName + "." + extension, { type: blob.type }) });
      }, "image/webp", 0.9);
    } catch (error) {
      signal?.removeEventListener("abort", abort);
      reject(error instanceof DOMException && error.name === "SecurityError"
        ? new Error(remoteImageError)
        : new Error("Não foi possível gerar o recorte. Tente novamente."));
    }
  });
}
