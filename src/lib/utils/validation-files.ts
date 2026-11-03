import { z } from "zod";

export const imageFileSchema = z
  .file()
  .min(1, "Selecione uma imagem não vazia.")
  .max(5 * 1024 * 1024, "A imagem deve ter no máximo 5 MB.");
export const pdfFileSchema = z
  .file()
  .min(1, "Selecione um PDF não vazio.")
  .max(10 * 1024 * 1024, "O PDF deve ter no máximo 10 MB.");

async function readHeader(file: File): Promise<Uint8Array> {
  const header = file.slice(0, 12);
  if (typeof header.arrayBuffer === "function") return new Uint8Array(await header.arrayBuffer());
  // FileReader also supports browsers and DOM test environments without Blob.arrayBuffer.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Não foi possível ler o arquivo."));
    reader.onabort = () => reject(new DOMException("Leitura cancelada.", "AbortError"));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) resolve(new Uint8Array(reader.result));
      else reject(new Error("Não foi possível ler o arquivo."));
    };
    reader.readAsArrayBuffer(header);
  });
}

function startsWith(bytes: Uint8Array, signature: readonly number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[index + offset] === byte);
}

export async function validateImage(input: File): Promise<File> {
  const file = imageFileSchema.parse(input);
  const bytes = await readHeader(file);
  // Match ImagemDoProduto: content decides the format, never client MIME or filename.
  const jpeg = startsWith(bytes, [255, 216, 255]);
  const png = startsWith(bytes, [137, 80, 78, 71, 13, 10, 26, 10]);
  const webp = startsWith(bytes, [82, 73, 70, 70]) && startsWith(bytes, [87, 69, 66, 80], 8);
  if (bytes.length < 12 || !(jpeg || png || webp)) {
    throw new z.ZodError([
      { code: "custom", path: ["imagem"], message: "Use uma imagem JPEG, PNG ou WebP válida." },
    ]);
  }
  return file;
}
export async function validatePdf(input: File): Promise<File> {
  const file = pdfFileSchema.parse(input);
  const bytes = await readHeader(file);
  if (!startsWith(bytes, [37, 80, 68, 70, 45])) {
    throw new z.ZodError([
      { code: "custom", path: ["fds"], message: "Use um arquivo PDF válido." },
    ]);
  }
  return file;
}
