import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { eyeFeatures } from "./estimation";

const scope = self as unknown as {
  import: (url: string) => Promise<unknown>;
  postMessage: (message: unknown) => void;
  onmessage: ((event: MessageEvent) => void) | null;
};
scope.import = (url) => import(/* @vite-ignore */ url);
let detector: FaceLandmarker | undefined;

scope.onmessage = async (
  event: MessageEvent<{ type: string; base?: string; image?: ImageBitmap; timestamp?: number }>,
) => {
  const { type, base, image, timestamp } = event.data;
  try {
    if (type === "init") {
      const vision = await FilesetResolver.forVisionTasks(`${base}mediapipe`);
      detector = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: `${base}models/face_landmarker.task`, delegate: "CPU" },
        runningMode: "VIDEO",
        numFaces: 1,
        outputFaceBlendshapes: true,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      scope.postMessage({ type: "ready" });
    } else if (type === "frame" && image && detector && timestamp !== undefined) {
      const result = detector.detectForVideo(image, timestamp);
      const blinking = result.faceBlendshapes[0]?.categories.some(
        (c) =>
          (c.categoryName === "eyeBlinkLeft" || c.categoryName === "eyeBlinkRight") &&
          c.score > 0.5,
      );
      scope.postMessage({
        type: "features",
        features: blinking ? null : eyeFeatures(result.faceLandmarks[0] ?? []),
      });
    }
  } catch (error) {
    scope.postMessage({
      type: "error",
      message:
        "Não foi possível executar o reconhecimento dos olhos. Verifique a conexão e tente outro navegador atualizado.",
      detail: error instanceof Error ? error.message : String(error),
    });
  } finally {
    image?.close();
  }
};
