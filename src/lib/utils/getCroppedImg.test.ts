import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getCroppedImg } from "./getCroppedImg";

describe("getCroppedImg", () => {
  let canvas: HTMLCanvasElement;
  const drawImage = vi.fn();
  beforeEach(() => {
    drawImage.mockClear();
    vi.stubGlobal("Image", class {
      naturalWidth = 8000;
      naturalHeight = 6000;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      crossOrigin = "";
      setAttribute(name: string, value: string) { if (name === "crossOrigin") this.crossOrigin = value; }
      set src(value: string) { if (value) queueMicrotask(() => this.onload?.()); }
    });
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 2 });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias -- Inspect the canvas created by the browser API under test.
      canvas = this;
      return { drawImage, scale: vi.fn(), imageSmoothingQuality: "high" } as unknown as CanvasRenderingContext2D;
    });
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => {
      callback(new Blob(["pixels"], { type: "image/webp" }));
    });
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("exports natural image pixels independently of the screen pixel ratio", async () => {
    const { file } = await getCroppedImg("https://res.cloudinary.com/demo/image/upload/sample.jpg", { x: 10, y: 20, width: 100, height: 150 });
    expect([canvas.width, canvas.height]).toEqual([100, 150]);
    expect(file.type).toBe("image/webp");
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 10, 20, 100, 150, 0, 0, 100, 150);
  });

  it("limits output dimensions while keeping the crop aspect ratio", async () => {
    await getCroppedImg("blob:image", { x: 0, y: 0, width: 4000, height: 3000 });
    expect([canvas.width, canvas.height]).toEqual([2048, 1536]);
  });

  it("rejects a crop outside the source image", async () => {
    await expect(getCroppedImg("blob:image", { x: 7900, y: 0, width: 200, height: 100 })).rejects.toThrow(/recorte/i);
  });

  it("rejects nonfinite dimensions before drawing", async () => {
    await expect(getCroppedImg("blob:image", { x: 0, y: 0, width: NaN, height: 100 })).rejects.toThrow(/recorte/i);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it("does not export an already canceled edit", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(getCroppedImg("blob:image", { x: 0, y: 0, width: 100, height: 100 }, { signal: controller.signal })).rejects.toMatchObject({ name: "AbortError" });
  });

  it("keeps the actual encoded format when WebP falls back to PNG", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(new Blob(["pixels"], { type: "image/png" })));
    const { file } = await getCroppedImg("blob:image", { x: 0, y: 0, width: 100, height: 100 });
    expect(file.type).toBe("image/png");
    expect(file.name).toMatch(/\.png$/);
  });

  it("reports an inaccessible source instead of attempting to draw", async () => {
    vi.stubGlobal("Image", class {
      onerror: (() => void) | null = null;
      set src(value: string) { if (value) queueMicrotask(() => this.onerror?.()); }
    });
    await expect(getCroppedImg("https://example.com/private.jpg", { x: 0, y: 0, width: 100, height: 100 })).rejects.toThrow(/carregar.*CORS/);
    expect(drawImage).not.toHaveBeenCalled();
  });

  it("reports canvas security failures with a recoverable CORS message", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(() => { throw new DOMException("Tainted canvas", "SecurityError"); });
    await expect(getCroppedImg("https://example.com/image.jpg", { x: 0, y: 0, width: 100, height: 100 })).rejects.toThrow(/CORS/);
  });

  it("rejects empty encoding results", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => callback(null));
    await expect(getCroppedImg("blob:image", { x: 0, y: 0, width: 100, height: 100 })).rejects.toThrow(/gerar o arquivo/);
  });

  it("discards an export canceled while encoding is still pending", async () => {
    let finish!: BlobCallback;
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(callback => { finish = callback; });
    const controller = new AbortController();
    const exportPromise = getCroppedImg("blob:image", { x: 0, y: 0, width: 100, height: 100 }, { signal: controller.signal });
    const rejected = expect(exportPromise).rejects.toMatchObject({ name: "AbortError" });
    await vi.waitFor(() => expect(finish).toBeDefined());
    controller.abort();
    finish(new Blob(["pixels"], { type: "image/webp" }));
    await rejected;
  });
});
