import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { useSpeechInput } from "@/hooks/use-speech-input";

type ResultEvent = Event & {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }>;
};
type ErrorEvent = Event & { error: string; message: string };

// Only the external recognition service is replaced; lifecycle/state are the real hook.
class BrowserRecognition {
  static instances: BrowserRecognition[] = [];
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: ((event: Event) => void) | null = null;
  onspeechstart: ((event: Event) => void) | null = null;
  onspeechend: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onnomatch: ((event: Event) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onresult: ((event: ResultEvent) => void) | null = null;
  aborted = false;
  stopError: Error | undefined;
  abortError: Error | undefined;
  constructor() {
    BrowserRecognition.instances.push(this);
  }
  start() {
    this.onstart?.(new Event("start"));
  }
  stop() {
    if (this.stopError) throw this.stopError;
  }
  abort() {
    this.aborted = true;
    if (this.abortError) throw this.abortError;
  }
}

function resultEvent(text: string, final = true): ResultEvent {
  return Object.assign(new Event("result"), {
    resultIndex: 0,
    results: [Object.assign([{ transcript: text, confidence: 1 }], { isFinal: final })],
  });
}

function currentRecognition() {
  const recognizer = BrowserRecognition.instances.at(-1);
  if (!recognizer) throw new Error("No recognition session started");
  return recognizer;
}

beforeEach(() => {
  BrowserRecognition.instances = [];
  vi.stubGlobal("SpeechRecognition", BrowserRecognition);
  vi.stubGlobal("webkitSpeechRecognition", undefined);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("useSpeechInput", () => {
  it.each([
    { change: "scope", scope: "conversation-b", language: "pt-BR" },
    { change: "language", scope: "conversation-a", language: "en-US" },
  ])(
    "isolates a new session when $change changes, including already queued browser callbacks",
    ({ scope, language }) => {
      const finals: string[] = [];
      const { result, rerender } = renderHook(
        (props) =>
          useSpeechInput({ ...props, enabled: true, onFinal: (text) => finals.push(text) }),
        {
          initialProps: { scope: "conversation-a", language: "pt-BR" },
        },
      );
      act(() => result.current.start());
      const old = currentRecognition();
      const late = {
        result: old.onresult,
        error: old.onerror,
        end: old.onend,
        speech: old.onspeechstart,
      };
      act(() => old.onresult?.(resultEvent("rascunho anterior", false)));
      expect(result.current.transcript).toBe("rascunho anterior");
      rerender({ scope, language });
      expect(old.aborted).toBe(true);
      expect(old.onresult).toBeNull();
      expect(old.onerror).toBeNull();
      expect(old.onend).toBeNull();
      expect(result.current.phase).toBe("idle");
      expect(result.current.transcript).toBe("");
      act(() => result.current.start());
      const current = currentRecognition();
      expect(current.lang).toBe(language);
      act(() => {
        current.onspeechstart?.(new Event("speechstart"));
        late.result?.(resultEvent("resultado obsoleto"));
        late.error?.(
          Object.assign(new Event("error"), { error: "network", message: "Old network error" }),
        );
        late.end?.(new Event("end"));
        late.speech?.(new Event("speechstart"));
      });
      expect(result.current.phase).toBe("listening");
      expect(result.current.speaking).toBe(true);
      expect(result.current.error).toBeNull();
      expect(finals).toEqual([]);
      act(() => current.onresult?.(resultEvent("resultado atual")));
      expect(finals).toEqual(["resultado atual"]);
    },
  );

  it("recovers from a stop failure and allows a fresh session", () => {
    const { result } = renderHook(() =>
      useSpeechInput({ enabled: true, language: "pt-BR", scope: "chat", onFinal: () => {} }),
    );
    act(() => result.current.start());
    const failed = currentRecognition();
    failed.stopError = new Error("The service ended unexpectedly");
    act(() => result.current.stop());
    expect(failed.aborted).toBe(true);
    expect(result.current.active).toBe(false);
    expect(result.current.error).toMatch(/não foi possível reconhecer/i);
    act(() => result.current.start());
    expect(currentRecognition()).not.toBe(failed);
    expect(result.current.active).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("detaches callbacks before aborting even when the browser throws during cleanup", () => {
    const finals: string[] = [];
    const { result, unmount } = renderHook(() =>
      useSpeechInput({
        enabled: true,
        language: "pt-BR",
        scope: "chat",
        onFinal: (text) => finals.push(text),
      }),
    );
    act(() => result.current.start());
    const recognizer = currentRecognition();
    const lateResult = recognizer.onresult;
    recognizer.abortError = new Error("Already stopped");
    expect(() => unmount()).not.toThrow();
    expect(recognizer.aborted).toBe(true);
    expect([
      recognizer.onstart,
      recognizer.onspeechstart,
      recognizer.onspeechend,
      recognizer.onend,
      recognizer.onnomatch,
      recognizer.onerror,
      recognizer.onresult,
    ]).toEqual([null, null, null, null, null, null, null]);
    act(() => lateResult?.(resultEvent("late")));
    expect(finals).toEqual([]);
  });

  it.each([
    { code: "service-not-allowed", expected: /permissão/i },
    { code: "language-not-supported", expected: /idioma/i },
    { code: "unrecognized-service-error", expected: /não foi possível reconhecer/i },
  ])("ends a failed session and exposes useful guidance for $code", ({ code, expected }) => {
    const { result } = renderHook(() =>
      useSpeechInput({ enabled: true, language: "pt-BR", scope: "chat", onFinal: () => {} }),
    );
    act(() => result.current.start());
    act(() =>
      currentRecognition().onerror?.(
        Object.assign(new Event("error"), { error: code, message: "Private service detail" }),
      ),
    );
    expect(result.current.active).toBe(false);
    expect(result.current.transcript).toBe("");
    expect(result.current.error).toMatch(expected);
    expect(result.current.error).not.toContain("Private service detail");
  });

  it("treats the browser's aborted event as cancellation without an error", () => {
    const { result } = renderHook(() =>
      useSpeechInput({ enabled: true, language: "pt-BR", scope: "chat", onFinal: () => {} }),
    );
    act(() => result.current.start());
    act(() => currentRecognition().onresult?.(resultEvent("interim", false)));
    act(() =>
      currentRecognition().onerror?.(
        Object.assign(new Event("error"), { error: "aborted", message: "" }),
      ),
    );
    expect(result.current.phase).toBe("idle");
    expect(result.current.error).toBeNull();
    expect(result.current.transcript).toBe("");
  });
});
