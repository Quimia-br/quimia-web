import { openCamera } from "./camera";

export async function startTracking(
  signal: AbortSignal,
  onFeatures: (features: number[] | null) => void,
  onError: (message: string) => void,
) {
  if (
    typeof Worker === "undefined" ||
    typeof createImageBitmap === "undefined" ||
    typeof OffscreenCanvas === "undefined"
  )
    throw new Error(
      "Este navegador não oferece os recursos necessários. Use uma versão atual do Chrome ou Edge para a navegação pelo olhar.",
    );
  const worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  let camera: Awaited<ReturnType<typeof openCamera>> | undefined;
  let frame = 0;
  let stopped = false;
  let busy = false;
  let last = 0;
  let lastVideo = -1;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  function stop() {
    if (stopped) return;
    stopped = true;
    cancelAnimationFrame(frame);
    clearTimeout(watchdog);
    clearInterval(heartbeat);
    worker.terminate();
    camera?.stop();
    signal.removeEventListener("abort", stop);
  }
  signal.addEventListener("abort", stop, { once: true });
  try {
    signal.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () =>
          finish(
            new Error(
              "O modelo de navegação demorou para carregar. Verifique sua conexão e tente novamente.",
            ),
          ),
        30_000,
      );
      function abort() {
        finish(new DOMException("Cancelled", "AbortError"));
      }
      function finish(error?: Error) {
        clearTimeout(timeout);
        signal.removeEventListener("abort", abort);
        if (error) reject(error);
        else resolve();
      }
      signal.addEventListener("abort", abort, { once: true });
      worker.onerror = () =>
        finish(new Error("Não foi possível carregar o reconhecimento dos olhos."));
      worker.onmessage = (event: MessageEvent) => {
        if (event.data.type === "ready") finish();
        else if (event.data.type === "error") finish(new Error(event.data.message));
      };
      worker.postMessage({
        type: "init",
        base: new URL(import.meta.env.BASE_URL, window.location.href).href,
      });
    });
    signal.throwIfAborted();
    camera = await openCamera(signal);
    signal.throwIfAborted();
    const video = camera.video;
    function fail(message: string) {
      stop();
      onError(message);
    }
    let lastResult = performance.now();
    heartbeat = setInterval(() => {
      if (performance.now() - lastResult > 5000)
        fail("A câmera deixou de fornecer imagens. Ative novamente para recalibrar.");
    }, 1000);
    worker.onerror = () =>
      fail("O reconhecimento dos olhos foi interrompido. Ative novamente para recalibrar.");
    worker.onmessage = (event: MessageEvent) => {
      clearTimeout(watchdog);
      busy = false;
      if (stopped) return;
      if (event.data.type === "error") fail(event.data.message);
      else if (event.data.type === "features") {
        lastResult = performance.now();
        onFeatures(event.data.features);
      }
    };
    async function tick(now: number) {
      if (stopped) return;
      frame = requestAnimationFrame(tick);
      if (busy || now - last < 66 || video.readyState < 2 || video.currentTime === lastVideo)
        return;
      last = now;
      lastVideo = video.currentTime;
      busy = true;
      try {
        const bitmap = await createImageBitmap(video);
        if (stopped) {
          bitmap.close();
          return;
        }
        worker.postMessage({ type: "frame", image: bitmap, timestamp: performance.now() }, [
          bitmap,
        ]);
        watchdog = setTimeout(
          () => fail("A câmera parou de responder. Ative novamente para recalibrar."),
          3000,
        );
      } catch {
        fail("Não foi possível ler a câmera. Ative novamente para tentar outra vez.");
      }
    }
    frame = requestAnimationFrame(tick);
    return { stop };
  } catch (error) {
    stop();
    throw error;
  }
}
