import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SendMessage from "./SendMessage";

beforeEach(() => {
  // Native browser APIs needed by Lina; layout is verified in Chrome.
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false, media, addEventListener() {}, removeEventListener() {},
  }));
  vi.stubGlobal("ResizeObserver", class {
    observe() {} unobserve() {} disconnect() {}
  });
  vi.stubGlobal("SpeechRecognition", undefined);
  vi.stubGlobal("webkitSpeechRecognition", undefined);
  Recognition.current = undefined;
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

class Recognition {
  static current: Recognition | undefined;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onspeechstart: (() => void) | null = null;
  onspeechend: (() => void) | null = null;
  onresult: ((event: unknown) => void) | null = null;
  onerror: ((event: unknown) => void) | null = null;
  aborted = false;
  constructor() { Recognition.current = this; }
  start() { this.onstart?.(); }
  stop() {}
  abort() { this.aborted = true; }
  result(text: string, final: boolean) {
    this.onresult?.({ results: [Object.assign([{ transcript: text, confidence: 1 }], { isFinal: final })], resultIndex: 0 });
  }
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

describe("SendMessage", () => {
  it("renders an accessible empty textarea and prevents empty or whitespace sends", async () => {
    const send = vi.fn();
    render(<SendMessage onSend={send} />);
    const input = screen.getByRole("textbox", { name: "Mensagem" });
    expect(input).toHaveAttribute("placeholder", "Escreva uma mensagem");
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
    fireEvent.change(input, { target: { value: " \n " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
  });

  it("sends trimmed text once and clears only after successful acceptance", async () => {
    const task = deferred(), send = vi.fn(() => task.promise);
    render(<SendMessage onSend={send} defaultValue={"  Olá\nmundo  "} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(send).toHaveBeenCalledExactlyOnceWith("Olá\nmundo");
    expect(screen.getByRole("textbox")).toHaveValue("  Olá\nmundo  ");
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    await act(async () => task.resolve());
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("supports Enter to send, Shift+Enter for newline, and waits for IME composition", async () => {
    const user = userEvent.setup(), send = vi.fn();
    render(<SendMessage onSend={send} voiceEnabled={false} />);
    const input = screen.getByRole("textbox");
    await user.type(input, "Olá{Shift>}{Enter}{/Shift}mundo");
    expect(input).toHaveValue("Olá\nmundo");
    expect(send).not.toHaveBeenCalled();
    fireEvent.compositionStart(input);
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    fireEvent.keyDown(input, { key: "Enter", keyCode: 229 });
    expect(send).not.toHaveBeenCalled();
    fireEvent.compositionEnd(input);
    await user.keyboard("{Enter}");
    expect(send).toHaveBeenCalledExactlyOnceWith("Olá\nmundo");
  });

  it.each([false, true])("preserves the draft on a failed send and allows retry (sync=%s)", async (sync) => {
    const send = vi.fn<() => Promise<void>>(() => { if (sync) throw new Error("Server secret"); return Promise.reject(new Error("Server secret")); });
    render(<SendMessage onSend={send} defaultValue="Minha mensagem" />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" })));
    expect(screen.getByRole("textbox")).toHaveValue("Minha mensagem");
    expect(screen.getByRole("alert")).toHaveTextContent(/não foi possível enviar/i);
    expect(screen.getByRole("alert")).not.toHaveTextContent("Server secret");
    send.mockImplementation(() => Promise.resolve());
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" })));
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("works as a controlled draft without needing a Router", async () => {
    const send = vi.fn();
    function Controlled() {
      const [text, setText] = useState("Olá");
      return <SendMessage value={text} onValueChange={setText} onSend={send} />;
    }
    render(<Controlled />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Texto editado" } });
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" })));
    expect(send).toHaveBeenCalledExactlyOnceWith("Texto editado");
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("exposes stop during generation, keeps draft editable, and blocks another send", () => {
    const send = vi.fn(), stop = vi.fn();
    const { rerender } = render(<SendMessage onSend={send} isGenerating onStop={stop} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Próxima pergunta" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Parar resposta" }));
    expect(stop).toHaveBeenCalledOnce();
    rerender(<SendMessage onSend={send} isGenerating />);
    expect(screen.getByRole("button", { name: "Aguardando resposta" })).toBeDisabled();
    expect(screen.getByRole("textbox")).toHaveValue("Próxima pergunta");
  });

  it("keeps stop available when onSend returns a promise lasting for the whole stream", async () => {
    const task = deferred(), send = vi.fn(() => task.promise), stop = vi.fn();
    const { rerender } = render(<SendMessage onSend={send} defaultValue="Pergunta" onStop={stop} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    rerender(<SendMessage onSend={send} defaultValue="Pergunta" isGenerating onStop={stop} />);
    expect(screen.getByRole("button", { name: "Parar resposta" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Parar resposta" }));
    expect(stop).toHaveBeenCalledOnce();
    await act(async () => task.resolve());
  });

  it("disables controls and supports hiding voice", () => {
    const send = vi.fn();
    render(<SendMessage onSend={send} defaultValue="Texto" disabled voiceEnabled={false} />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Enviar mensagem" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Ditar mensagem" })).not.toBeInTheDocument();
  });

  it("previews dictation appended to the draft, commits final text, and never auto sends", async () => {
    vi.stubGlobal("SpeechRecognition", Recognition);
    const send = vi.fn();
    render(<SendMessage onSend={send} defaultValue="Me explique:" />);
    fireEvent.click(screen.getByRole("button", { name: "Ditar mensagem" }));
    const speech = Recognition.current!;
    act(() => speech.onspeechstart?.());
    expect(screen.getByRole("button", { name: "Parar ditado" }).querySelector(".lucide-audio-lines")).not.toBeNull();
    act(() => speech.result("a creatina", false));
    expect(screen.getByRole("textbox")).toHaveValue("Me explique: a creatina");
    expect(send).not.toHaveBeenCalled();
    act(() => speech.result("a creatina", true));
    act(() => speech.onend?.());
    expect(screen.getByRole("textbox")).toHaveValue("Me explique: a creatina");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" })));
    expect(send).toHaveBeenCalledExactlyOnceWith("Me explique: a creatina");
  });

  it("cancels dictation on Escape and ignores late results after manual editing", () => {
    vi.stubGlobal("SpeechRecognition", Recognition);
    render(<SendMessage onSend={vi.fn()} defaultValue="Original" />);
    fireEvent.click(screen.getByRole("button", { name: "Ditar mensagem" }));
    const first = Recognition.current!;
    act(() => first.result("provisório", false));
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(screen.getByRole("textbox")).toHaveValue("Original");
    expect(first.aborted).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Ditar mensagem" }));
    const second = Recognition.current!, late = second.onresult;
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Manual" } });
    act(() => late?.({ results: [Object.assign([{ transcript: "Atrasado" }], { isFinal: true })] }));
    expect(screen.getByRole("textbox")).toHaveValue("Manual");
  });

  it("honors a text limit for voice results without silently truncating or sending them", () => {
    vi.stubGlobal("SpeechRecognition", Recognition);
    const send = vi.fn();
    render(<SendMessage onSend={send} maxLength={5} />);
    fireEvent.click(screen.getByRole("button", { name: "Ditar mensagem" }));
    act(() => Recognition.current!.result("Texto longo", true));
    act(() => Recognition.current!.onend?.());
    expect(screen.getByRole("textbox")).toHaveValue("Texto longo");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
  });

  it("does not call draft updates after unmounting during a pending send", async () => {
    const task = deferred(), changed = vi.fn();
    const { unmount } = render(<SendMessage onSend={() => task.promise} value="Texto" onValueChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    unmount();
    await act(async () => task.resolve());
    expect(changed).not.toHaveBeenCalled();
  });

  it("preserves a newer controlled draft when an older send succeeds", async () => {
    const task = deferred(), changed = vi.fn(), send = () => task.promise;
    const { rerender } = render(<SendMessage onSend={send} value="Original" onValueChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensagem" }));
    rerender(<SendMessage onSend={send} value="Novo rascunho" onValueChange={changed} />);
    await act(async () => task.resolve());
    expect(changed).not.toHaveBeenCalled();
    expect(screen.getByRole("textbox")).toHaveValue("Novo rascunho");
  });
});
