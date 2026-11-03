import { useEffect, useRef, useSyncExternalStore } from "react";
import mascotVideo from "@/assets/loading/mascot.mp4";
import mascotPoster from "@/assets/loading/mascot-poster.webp";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches;
const getServerReducedMotion = () => true;

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia(reducedMotionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function Loading() {
  const reduceMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotion,
    getServerReducedMotion,
  );
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlayback = () => {
      if (document.hidden || reduceMotion) {
        video.pause();
      } else {
        // The poster remains visible if the browser blocks automatic playback.
        void video.play().catch(() => {});
      }
    };

    syncPlayback();
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
      video.pause();
    };
  }, [reduceMotion]);

  return (
    <div
      data-route-loading
      className="flex min-h-dvh w-full flex-col items-center justify-center gap-6 bg-background px-6 py-10 text-foreground"
    >
      {reduceMotion ? (
        <img
          src={mascotPoster}
          alt=""
          aria-hidden="true"
          width={916}
          height={866}
          className="loading-mascot"
        />
      ) : (
        <video
          ref={videoRef}
          src={mascotVideo}
          poster={mascotPoster}
          width={916}
          height={866}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className="loading-mascot"
        />
      )}
      <p role="status" className="text-center text-2xl font-medium leading-normal">
        <span className="sr-only">Carregando</span>
        <span aria-hidden="true">
          Carregando
          <span className="loading-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </span>
      </p>
    </div>
  );
}

export default Loading;
