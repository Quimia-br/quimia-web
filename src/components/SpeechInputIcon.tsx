import { AudioLines, CircleAlert, LoaderCircle, Mic } from "lucide-react";
import { cn } from "cn";
import type { useSpeechInput } from "@/hooks/use-speech-input";

type SpeechInputIconProps = {
  speech: Pick<ReturnType<typeof useSpeechInput>, "speaking" | "phase" | "error">;
  className?: string;
};

/** Shared visual state; the parent owns its label, controls and transcript. */
export default function SpeechInputIcon({ speech, className }: SpeechInputIconProps) {
  const size = cn("size-6", className);
  if (speech.speaking) return <AudioLines aria-hidden="true" className={cn(size, "[&>path]:origin-center [&>path]:[transform-box:fill-box] motion-safe:[&>path]:animate-audio-wave [&>path:nth-child(2n)]:[animation-delay:-350ms] [&>path:nth-child(3n)]:[animation-delay:-175ms]")} />;
  if (speech.phase === "starting" || speech.phase === "stopping") return <LoaderCircle aria-hidden="true" className={cn(size, "motion-safe:animate-spin")} />;
  if (speech.error) return <CircleAlert aria-hidden="true" className={size} />;
  return <Mic aria-hidden="true" className={size} />;
}
