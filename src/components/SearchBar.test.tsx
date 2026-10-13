import { StrictMode, useState, type ComponentProps } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { parseAsString, useQueryState } from "nuqs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import SearchBar from "./SearchBar";

const routers: ReturnType<typeof createBrowserRouter>[] = [];
function createTestRouter(routes: Parameters<typeof createBrowserRouter>[0], options: { initialEntries?: string[]; initialIndex?: number } = {}) {
  const entries = options.initialEntries ?? ["/"];
  const index = options.initialIndex ?? entries.length - 1;
  window.history.replaceState({ idx: 0, key: "initial-0" }, "", entries[0]);
  for (let i = 1; i <= index; i++) window.history.pushState({ idx: i, key: `initial-${i}` }, "", entries[i]);
  const router = createBrowserRouter(routes.map((route) => ({ ...route, element: <NuqsAdapter>{route.element}</NuqsAdapter> })));
  routers.push(router);
  return router;
}

beforeEach(() => {
  // nuqs's global rate limiter uses performance.now across test cases.
  // Keep that clock monotonic while controlling the component's timers.
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] });
  vi.stubGlobal("SpeechRecognition", undefined);
  vi.stubGlobal("webkitSpeechRecognition", undefined);
  FakeRecognition.instances = [];
  FakeRecognition.startError = undefined;
});
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function renderSearch(path = "/products?sort=name#results", props: ComponentProps<typeof SearchBar> = {}) {
  const router = createTestRouter([{ path: "*", element: <SearchBar {...props} /> }], { initialEntries: [path] });
  const view = render(<RouterProvider router={router} />);
  return { router, ...view };
}

async function advance(ms: number) {
  await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
}

// The microphone/service are external browser APIs, unavailable in JSDOM.
// Router, timers, inputs and UI primitives remain real.
class FakeRecognition {
  static instances: FakeRecognition[] = [];
  static startError: Error | undefined;
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  aborted = false;
  stopped = false;
  onstart: ((event: Event) => void) | null = null;
  onspeechstart: ((event: Event) => void) | null = null;
  onspeechend: ((event: Event) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
  onnomatch: ((event: Event) => void) | null = null;
  onerror: ((event: Event & { error: string; message: string }) => void) | null = null;
  onresult: ((event: Event & { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null = null;

  constructor() { FakeRecognition.instances.push(this); }
  start() {
    if (FakeRecognition.startError) throw FakeRecognition.startError;
    this.onstart?.(new Event("start"));
  }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; this.onend?.(new Event("end")); }
  result(items: { text: string; final: boolean }[]) {
    const results = items.map(({ text, final }) => Object.assign([{ transcript: text, confidence: 0.9 }], { isFinal: final }));
    this.onresult?.(Object.assign(new Event("result"), { results, resultIndex: 0 }));
  }
  error(error: string) { this.onerror?.(Object.assign(new Event("error"), { error, message: "Recognition failed" })); }
  end() { this.onend?.(new Event("end")); }
}

function enableVoice(prefixed = false) {
  vi.stubGlobal(prefixed ? "webkitSpeechRecognition" : "SpeechRecognition", FakeRecognition);
}

function startVoice() {
  fireEvent.click(screen.getByRole("button", { name: "Buscar por voz" }));
  return FakeRecognition.instances.at(-1)!;
}

describe("SearchBar", () => {
  it("shares only the applied debounced q with another nuqs consumer", async () => {
    function AppliedQuery() {
      const [q] = useQueryState("q", parseAsString.withDefault(""));
      return <output aria-label="Pesquisa aplicada">{q}</output>;
    }
    const router = createTestRouter([{ path: "*", element: <><SearchBar /><AppliedQuery /></> }], { initialEntries: ["/products?q=original"] });
    render(<RouterProvider router={router} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "nova pesquisa" } });
    await advance(399);
    expect(screen.getByLabelText("Pesquisa aplicada")).toHaveTextContent("original");
    await advance(51);
    expect(screen.getByLabelText("Pesquisa aplicada")).toHaveTextContent("nova pesquisa");
    expect(router.state.location.search).toBe("?q=nova+pesquisa");
  });
  it("shows a saved query and retains it without navigating on mount", async () => {
    const { router } = renderSearch("/products?q=vitamina+C&sort=name#results");
    expect(screen.getByRole("searchbox")).toHaveValue("vitamina C");
    const key = router.state.location.key;
    await advance(1000);
    expect(router.state.location.key).toBe(key);
  });

  it("debounces the last edit and keeps the path, other filters and hash", async () => {
    const { router } = renderSearch();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "vita" } });
    await advance(300);
    fireEvent.change(input, { target: { value: "vitamina C" } });
    expect(input).toHaveValue("vitamina C");
    await advance(399);
    expect(router.state.location.search).toBe("?sort=name");
    await advance(1);
    await advance(50); // nuqs batches the browser URL write separately from the draft debounce.
    expect(router.state.location.pathname).toBe("/products");
    expect(router.state.location.search).toBe("?sort=name&q=vitamina+C");
    expect(router.state.location.hash).toBe("#results");
  });

  it("applies Enter immediately without submitting a surrounding form", async () => {
    const outerSubmit = vi.fn((event) => event.preventDefault());
    const router = createTestRouter([{ path: "*", element: <form onSubmit={outerSubmit}><SearchBar /></form> }]);
    render(<RouterProvider router={router} />);
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "  creatina  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await advance(50);
    expect(router.state.location.search).toBe("?q=creatina");
    expect(input).toHaveValue("creatina");
    expect(outerSubmit).not.toHaveBeenCalled();
    const key = router.state.location.key;
    await advance(1000);
    expect(router.state.location.key).toBe(key);
  });

  it("resets p atomically when a new search is applied", async () => {
    const { router } = renderSearch("/products?q=antigo&p=8&sort=name#results");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "novo" } });
    await advance(450);
    expect(new URLSearchParams(router.state.location.search).get("q")).toBe("novo");
    expect(new URLSearchParams(router.state.location.search).has("p")).toBe(false);
    expect(new URLSearchParams(router.state.location.search).get("sort")).toBe("name");
    expect(router.state.location.hash).toBe("#results");
  });

  it("preserves p when reapplying the unchanged search", async () => {
    const { router } = renderSearch("/products?q=creatina&p=8");
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
    await advance(50);
    expect(new URLSearchParams(router.state.location.search).get("p")).toBe("8");
  });

  it("keeps the magnifying glass decorative and applies typing only after debounce", async () => {
    const { router } = renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "whey" } });
    expect(screen.queryByRole("button", { name: "Aplicar pesquisa" })).not.toBeInTheDocument();
    expect(router.state.location.search).toBe("?sort=name");
    await advance(450);
    expect(router.state.location.search).toBe("?sort=name&q=whey");
  });

  it("focuses the input through the search icon label without applying the pending query", async () => {
    vi.useRealTimers();
    const user = userEvent.setup();
    const { router } = renderSearch("/products", { id: "product-search" });
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "whey" } });
    const iconLabel = screen.getByRole("searchbox").closest("search")?.querySelector('label[for="product-search"]:not(.sr-only)');
    expect(iconLabel).not.toBeNull();
    await user.click(iconLabel!);
    expect(screen.getByRole("searchbox")).toHaveFocus();
    expect(router.state.location.search).toBe("");
  });

  it("clears q immediately, preserves repeated filters, and restores focus", async () => {
    const { router } = renderSearch("/products?tag=a&tag=b&q=creatina#items");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pendente" } });
    fireEvent.click(screen.getByRole("button", { name: "Limpar pesquisa" }));
    await advance(50);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getByRole("searchbox")).toHaveFocus();
    expect(router.state.location.search).toBe("?tag=a&tag=b");
    expect(router.state.location.hash).toBe("#items");
    await advance(1000);
    expect(router.state.location.search).toBe("?tag=a&tag=b");
  });

  it("removes q for whitespace and encodes special characters as query text", async () => {
    const { router } = renderSearch("/products?q=old");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "   " } });
    await advance(450);
    expect(router.state.location.search).toBe("");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "café & C++?" } });
    await advance(450);
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("q")).toBe("café & C++?");
    expect(params.size).toBe(1);
  });

  it("replaces history entries instead of adding an entry for each edit", async () => {
    vi.useRealTimers();
    const router = createTestRouter([{ path: "*", element: <SearchBar /> }], {
      initialEntries: ["/home", "/products?q=old"], initialIndex: 1,
    });
    render(<RouterProvider router={router} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "new" } });
    await waitFor(() => expect(router.state.location.search).toBe("?q=new"));
    await act(async () => { await router.navigate(-1); });
    await waitFor(() => expect(router.state.location.pathname).toBe("/home"));
    expect(router.state.location.pathname).toBe("/home");
    expect(screen.getByRole("searchbox")).toHaveValue("");
  });

  it("cancels a pending edit when navigating and follows the new URL", async () => {
    const { router } = renderSearch("/products?q=old");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "stale" } });
    await advance(200);
    await act(async () => { await router.navigate("/graphs?q=current#chart"); });
    expect(screen.getByRole("searchbox")).toHaveValue("current");
    await advance(1000);
    expect(router.state.location.pathname).toBe("/graphs");
    expect(router.state.location.search).toBe("?q=current");
    expect(router.state.location.hash).toBe("#chart");
  });

  it("does not navigate after the component unmounts with a pending timer", async () => {
    const { router, unmount } = renderSearch();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "stale" } });
    unmount();
    await advance(1000);
    expect(router.state.location.search).toBe("?sort=name");
  });

  it("waits for IME composition to finish before searching", async () => {
    const { router } = renderSearch("/products");
    const input = screen.getByRole("searchbox");
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "茶" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    await advance(1000);
    expect(router.state.location.search).toBe("");
    fireEvent.compositionEnd(input, { data: "茶" });
    await advance(450);
    expect(router.state.location.search).toBe("?q=%E8%8C%B6");
  });

  it("supports a custom debounce and avoids navigating for an unchanged query", async () => {
    const { router } = renderSearch("/products?q=whey", { debounceMs: 750, label: "Pesquisar produtos" });
    const input = screen.getByRole("searchbox", { name: "Pesquisar produtos" });
    const key = router.state.location.key;
    fireEvent.change(input, { target: { value: "whey " } });
    await advance(750);
    expect(router.state.location.key).toBe(key);
    fireEvent.change(input, { target: { value: "albumina" } });
    await advance(749);
    expect(router.state.location.search).toBe("?q=whey");
    await advance(1);
    await advance(50);
    expect(router.state.location.search).toBe("?q=albumina");
  });

  it("removes an explicitly empty q parameter when applying an empty search", async () => {
    const { router } = renderSearch("/products?q=&sort=name");
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Enter" });
    await advance(50);
    expect(router.state.location.search).toBe("?sort=name");
  });

  it("applies a single pending search under StrictMode effect replay", async () => {
    const router = createTestRouter([{ path: "*", element: <StrictMode><SearchBar /></StrictMode> }]);
    render(<RouterProvider router={router} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "creatina" } });
    await advance(450);
    expect(router.state.location.search).toBe("?q=creatina");
    const key = router.state.location.key;
    await advance(1000);
    expect(router.state.location.key).toBe(key);
  });

  it("keeps typing available when speech recognition is unsupported", async () => {
    const { router } = renderSearch();
    expect(screen.getByRole("button", { name: "Buscar por voz" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Buscar por voz" })).toHaveAccessibleDescription(/navegador/i);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "vitamina" } });
    await advance(450);
    expect(router.state.location.search).toBe("?sort=name&q=vitamina");
  });

  it.each([false, true])("previews speech without querying interim text and commits final results (prefixed=%s)", async (prefixed) => {
    enableVoice(prefixed);
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    expect(recognition.lang).toBe("pt-BR");
    expect(screen.getByRole("button", { name: "Parar ditado" })).toHaveAttribute("aria-pressed", "true");
    act(() => recognition.result([{ text: "vita", final: false }]));
    expect(screen.getByRole("searchbox")).toHaveValue("vita");
    await advance(1000);
    expect(router.state.location.search).toBe("");
    act(() => recognition.result([{ text: "vitamina C", final: true }]));
    act(() => recognition.end());
    expect(screen.getByRole("searchbox")).toHaveValue("vitamina C");
    await advance(450);
    expect(router.state.location.search).toBe("?q=vitamina+C");
  });

  it("reconstructs revised recognition results without duplicating text", async () => {
    enableVoice();
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    act(() => recognition.result([{ text: "vitamina", final: true }, { text: "de", final: false }]));
    act(() => recognition.result([{ text: "vitamina", final: true }, { text: "D", final: true }]));
    act(() => recognition.end());
    await advance(450);
    expect(router.state.location.search).toBe("?q=vitamina+D");
  });

  it("lets the user stop and waits for the final result before ending speech", async () => {
    enableVoice();
    const { router } = renderSearch("/products", { speechLang: "en-US" });
    const recognition = startVoice();
    expect(recognition.lang).toBe("en-US");
    fireEvent.click(screen.getByRole("button", { name: "Parar ditado" }));
    expect(recognition.stopped).toBe(true);
    expect(screen.getByRole("button", { name: "Parar ditado" })).toBeDisabled();
    act(() => recognition.result([{ text: "protein", final: true }]));
    act(() => recognition.end());
    await advance(450);
    expect(router.state.location.search).toBe("?q=protein");
  });

  it("shows AudioLines only while speech is detected and keeps status text visually hidden", () => {
    enableVoice();
    renderSearch("/products");
    const recognition = startVoice();
    const button = screen.getByRole("button", { name: "Parar ditado" });
    expect(button.querySelector(".lucide-audio-lines")).toBeNull();
    expect(screen.getByRole("status")).toHaveClass("sr-only");
    act(() => recognition.onspeechstart?.(new Event("speechstart")));
    expect(button.querySelector(".lucide-audio-lines")).not.toBeNull();
    expect(button).toHaveAttribute("data-state", "speaking");
    act(() => recognition.onspeechend?.(new Event("speechend")));
    expect(button.querySelector(".lucide-audio-lines")).toBeNull();
    expect(button).toHaveAttribute("data-state", "listening");
  });

  it("ends the speaking animation when stopped and ignores obsolete speech events", () => {
    enableVoice();
    renderSearch("/products");
    const recognition = startVoice();
    const lateSpeech = recognition.onspeechstart;
    act(() => recognition.onspeechstart?.(new Event("speechstart")));
    fireEvent.click(screen.getByRole("button", { name: "Parar ditado" }));
    expect(screen.getByRole("button", { name: "Parar ditado" }).querySelector(".lucide-audio-lines")).toBeNull();
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(recognition.onspeechstart).toBeNull();
    act(() => lateSpeech?.(new Event("speechstart")));
    expect(screen.getByRole("button", { name: "Buscar por voz" }).querySelector(".lucide-audio-lines")).toBeNull();
  });

  it("cancels speech on manual typing and ignores delayed results from that session", async () => {
    enableVoice();
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    const oldResult = recognition.onresult!;
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "manual" } });
    expect(recognition.aborted).toBe(true);
    act(() => oldResult(Object.assign(new Event("result"), { resultIndex: 0, results: [Object.assign([{ transcript: "obsolete", confidence: 1 }], { isFinal: true })] })));
    await advance(450);
    expect(router.state.location.search).toBe("?q=manual");
  });

  it("cancels provisional speech with Escape without searching it", async () => {
    enableVoice();
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    act(() => recognition.result([{ text: "provisório", final: false }]));
    fireEvent.keyDown(screen.getByRole("searchbox"), { key: "Escape" });
    expect(recognition.aborted).toBe(true);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    await advance(1000);
    expect(router.state.location.search).toBe("");
  });

  it.each([
    ["not-allowed", /permissão/i],
    ["audio-capture", /microfone/i],
    ["network", /conexão/i],
    ["no-speech", /fala/i],
  ])("reports speech error %s while keeping typed search available", async (error, message) => {
    enableVoice();
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    act(() => recognition.error(error));
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.getByRole("alert")).toHaveClass("sr-only");
    expect(screen.getByRole("button", { name: "Buscar por voz" }).querySelector(".lucide-circle-alert")).not.toBeNull();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "whey" } });
    await advance(450);
    expect(router.state.location.search).toBe("?q=whey");
  });

  it("handles a synchronous microphone start failure and allows retry", () => {
    enableVoice();
    FakeRecognition.startError = new DOMException("Permission denied", "NotAllowedError");
    renderSearch();
    startVoice();
    expect(screen.getByRole("alert")).toHaveTextContent(/permissão/i);
    FakeRecognition.startError = undefined;
    startVoice();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Parar ditado" })).toBeEnabled();
  });

  it("releases the microphone on navigation and ignores old service events", async () => {
    enableVoice();
    const { router } = renderSearch();
    const recognition = startVoice();
    await act(async () => { await router.navigate("/graphs?q=new"); });
    expect(recognition.aborted).toBe(true);
    act(() => recognition.result([{ text: "obsolete", final: true }]));
    await advance(1000);
    expect(router.state.location.search).toBe("?q=new");
    expect(screen.getByRole("searchbox")).toHaveValue("new");
  });

  it("releases the microphone on unmount", () => {
    enableVoice();
    const { unmount } = renderSearch();
    const recognition = startVoice();
    unmount();
    expect(recognition.aborted).toBe(true);
  });

  it("releases active speech when disabled and starts a fresh session when enabled again", () => {
    enableVoice();
    function Host() {
      const [disabled, setDisabled] = useState(false);
      return <><SearchBar disabled={disabled} /><button onClick={() => setDisabled(!disabled)}>Alternar disponibilidade</button></>;
    }
    const router = createTestRouter([{ path: "*", element: <Host /> }]);
    render(<RouterProvider router={router} />);
    const first = startVoice();
    act(() => first.result([{ text: "provisório", final: false }]));
    fireEvent.click(screen.getByRole("button", { name: "Alternar disponibilidade" }));
    expect(first.aborted).toBe(true);
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.getByRole("searchbox")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Alternar disponibilidade" }));
    const second = startVoice();
    expect(second).not.toBe(first);
    expect(screen.getByRole("button", { name: "Parar ditado" })).toBeEnabled();
  });

  it("reports an unrecognized utterance and leaves no provisional query", async () => {
    enableVoice();
    const { router } = renderSearch("/products");
    const recognition = startVoice();
    act(() => recognition.result([{ text: "provisório", final: false }]));
    act(() => recognition.onnomatch?.(new Event("nomatch")));
    expect(screen.getByRole("alert")).toHaveTextContent(/fala/i);
    expect(screen.getByRole("searchbox")).toHaveValue("");
    await advance(1000);
    expect(router.state.location.search).toBe("");
  });

  it("disables input and actions and can hide the voice feature", () => {
    enableVoice();
    renderSearch("/products", { disabled: true });
    expect(screen.getByRole("searchbox")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Aplicar pesquisa" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Buscar por voz" })).toBeDisabled();
    cleanup();
    renderSearch("/products", { voiceEnabled: false });
    expect(screen.queryByRole("button", { name: "Buscar por voz" })).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox")).toBeEnabled();
  });
});
