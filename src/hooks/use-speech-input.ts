import { useEffect, useRef, useState } from "react";

type SpeechResult = ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean };
type SpeechResultEvent = Event & { resultIndex: number; results: ArrayLike<SpeechResult> };
type SpeechErrorEvent = Event & { error: string; message: string };

// SpeechRecognition is not included consistently in TypeScript's DOM types.
// Keep the projection local instead of augmenting Window for the whole app.
interface SpeechRecognizer {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: ((event: Event) => void) | null;
  onspeechstart: ((event: Event) => void) | null;
  onspeechend: ((event: Event) => void) | null;
  onend: ((event: Event) => void) | null;
  onnomatch: ((event: Event) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getRecognizer() {
  if (typeof window === "undefined") return undefined;
  const browser = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognizer;
    webkitSpeechRecognition?: new () => SpeechRecognizer;
  };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}

function speechError(code: string) {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permissão para usar o microfone negada. Autorize o acesso no navegador ou digite a pesquisa.";
    case "audio-capture":
      return "Não foi possível acessar o microfone. Verifique o dispositivo ou digite a pesquisa.";
    case "network":
      return "Falha de conexão no ditado. Verifique sua conexão ou digite a pesquisa.";
    case "no-speech":
      return "Nenhuma fala foi reconhecida. Tente novamente ou digite a pesquisa.";
    case "language-not-supported":
      return "O idioma do ditado não está disponível. Digite a pesquisa.";
    default:
      return "Não foi possível reconhecer a fala. Tente novamente ou digite a pesquisa.";
  }
}

function release(recognizer: SpeechRecognizer | null) {
  if (!recognizer) return;
  recognizer.onstart = null;
  recognizer.onspeechstart = null;
  recognizer.onspeechend = null;
  recognizer.onend = null;
  recognizer.onnomatch = null;
  recognizer.onerror = null;
  recognizer.onresult = null;
  try { recognizer.abort(); } catch { /* Some engines have already ended. */ }
}

interface SpeechInputOptions {
  enabled: boolean;
  language: string;
  scope: string;
  onFinal: (transcript: string) => void;
}

export function useSpeechInput({ enabled, language, scope, onFinal }: SpeechInputOptions) {
  const Recognizer = getRecognizer();
  const recognizerRef = useRef<SpeechRecognizer | null>(null);
  const [phase, setPhase] = useState<"idle" | "starting" | "listening" | "stopping">("idle");
  const [transcript, setTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      const recognizer = recognizerRef.current;
      recognizerRef.current = null;
      release(recognizer);
      setPhase("idle");
      setSpeaking(false);
      setTranscript("");
      setError(null);
    };
  }, [enabled, language, scope]);

  function cancel() {
    const recognizer = recognizerRef.current;
    recognizerRef.current = null;
    release(recognizer);
    setPhase("idle");
    setSpeaking(false);
    setTranscript("");
    setError(null);
  }

  function start() {
    if (!enabled || !Recognizer || recognizerRef.current) return;
    setError(null);
    setTranscript("");
    let receivedFinal = false;
    setSpeaking(false);

    try {
      const recognizer = new Recognizer();
      recognizerRef.current = recognizer;
      recognizer.lang = language;
      recognizer.continuous = false;
      recognizer.interimResults = true;
      recognizer.maxAlternatives = 1;
      const current = () => recognizerRef.current === recognizer;

      recognizer.onstart = () => { if (current()) setPhase("listening"); };
      recognizer.onspeechstart = () => { if (current()) setSpeaking(true); };
      recognizer.onspeechend = () => { if (current()) setSpeaking(false); };
      recognizer.onresult = (event) => {
        if (!current()) return;
        const results = Array.from(event.results);
        const text = results.map((result) => result[0]?.transcript.trim() ?? "").filter(Boolean).join(" ");
        setTranscript(text);
        // Engines revise interim results and replay earlier final results.
        // Rebuild the complete utterance instead of appending each event.
        if (text && results.length && results.every((result) => result.isFinal)) {
          receivedFinal = true;
          onFinal(text);
        }
      };
      recognizer.onerror = (event) => {
        if (!current()) return;
        cancel();
        if (event.error !== "aborted") setError(speechError(event.error));
      };
      recognizer.onnomatch = () => {
        if (!current()) return;
        cancel();
        setError(speechError("no-speech"));
      };
      recognizer.onend = () => {
        if (!current()) return;
        recognizerRef.current = null;
        setPhase("idle");
        setSpeaking(false);
        setTranscript("");
        if (!receivedFinal) setError(speechError("no-speech"));
      };
      setPhase("starting");
      recognizer.start();
    } catch (cause) {
      cancel();
      setError(speechError(cause instanceof DOMException && cause.name === "NotAllowedError" ? "not-allowed" : "unknown"));
    }
  }

  function stop() {
    const recognizer = recognizerRef.current;
    if (!recognizer || phase === "stopping") return;
    setPhase("stopping");
    setSpeaking(false);
    try { recognizer.stop(); } catch {
      cancel();
      setError(speechError("unknown"));
    }
  }

  return { supported: !!Recognizer, active: enabled && phase !== "idle", speaking: enabled && phase === "listening" && speaking, phase, transcript, error, start, stop, cancel };
}
