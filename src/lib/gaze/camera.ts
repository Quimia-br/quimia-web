export async function openCamera(signal: AbortSignal) {
  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)
    throw new Error(
      "A navegação pelo olhar precisa de câmera e conexão HTTPS (ou localhost) em um navegador compatível.",
    );
  signal.throwIfAborted();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: "user",
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 20, max: 30 },
    },
  });
  if (signal.aborted) {
    stream.getTracks().forEach((track) => track.stop());
    signal.throwIfAborted();
  }
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  let stopped = false;
  function stop() {
    if (stopped) return;
    stopped = true;
    signal.removeEventListener("abort", stop);
    stream.getTracks().forEach((track) => track.stop());
    video.pause();
    video.srcObject = null;
  }
  signal.addEventListener("abort", stop, { once: true });
  try {
    await video.play();
    signal.throwIfAborted();
  } catch (error) {
    stop();
    throw error;
  }
  return { video, stop };
}
