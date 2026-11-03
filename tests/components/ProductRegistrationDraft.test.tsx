import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ProductCreateDialog from "@/components/ProductCreateDialog";
import Products from "@/pages/Products";
import { MemoryRouter } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { ThemeProvider } from "@/lib/theme-provider";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import { pendingAnalysis, registeredProduct } from "../fixtures/fds";
import {
  emptyProductDraft,
  loadProductDraft,
  saveProductDraft,
} from "@/lib/product-registration-draft";

const { saved } = vi.hoisted(() => ({ saved: new Map<number, unknown>() }));
vi.mock("@/lib/product-registration-draft", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/product-registration-draft")>();
  return {
    ...actual,
    loadProductDraft: vi.fn(async (owner: number) => actual.restoreProductDraft(saved.get(owner))),
    saveProductDraft: vi.fn(async (owner: number, draft: unknown) => {
      saved.set(owner, draft);
    }),
    clearProductDraft: vi.fn(async (owner: number) => {
      saved.delete(owner);
    }),
  };
});
const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const company = { id: 9101, nome: "Empresa", email: "empresa@example.com" };
function show(content = <ProductCreateDialog />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        {content}
        <ToastViewport label="Avisos da página" />
      </ToastProvider>
    </QueryClientProvider>,
  );
}
async function start() {
  const trigger = await screen.findByRole("button", { name: "Cadastrar produto" });
  await waitFor(() => expect(trigger).toBeEnabled());
  await userEvent.setup().click(trigger);
  fireEvent.change(screen.getByRole("textbox", { name: "Nome", exact: true }), {
    target: { value: "Produto recuperável" },
  });
  const user = userEvent.setup();
  const type = screen.getByRole("combobox", { name: "Tipo" });
  await waitFor(() => expect(type).toBeEnabled());
  await user.click(type);
  await user.click(await screen.findByRole("option", { name: "Alvejante" }));
}
beforeEach(() => {
  saved.clear();
  vi.mocked(saveProductDraft).mockImplementation(async (owner, draft) => {
    saved.set(owner, draft);
  });
  vi.mocked(loadProductDraft).mockClear();
  useAuthStore.getState().actions.login("test-token", company);
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  api.defaults.adapter = async (config) => ({
    config,
    data: config.url?.endsWith("/tipos")
      ? ["alvejante"]
      : config.url?.endsWith("/assincronas")
        ? { id: "job-1", status: "concluida", analise: pendingAnalysis, codigo: null, detail: null }
        : { situacao: "criado", produto: registeredProduct },
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  useAuthStore.getState().actions.logout();
  localStorage.clear();
  vi.unstubAllGlobals();
});
describe("product draft recovery and toasts", () => {
  it("restores only one product dialog on the empty products page and keeps it single after FDS errors", async () => {
    const file = new File(["%PDF-1.7"], "minha-fds.pdf", { type: "application/pdf" });
    const initial = emptyProductDraft();
    saved.set(company.id, {
      ...initial,
      open: true,
      view: "upload",
      fields: { nome: "Produto recuperável", tipo: "alvejante", descricao: "", codBarras: "" },
      fds: { ...initial.fds, file },
    });
    const adapter = api.defaults.adapter as import("axios").AxiosAdapter;
    api.defaults.adapter = async (config) => {
      if (config.method === "get" && config.url === "/empresas/me/produtos")
        return {
          config,
          status: 200,
          statusText: "OK",
          headers: new AxiosHeaders(),
          data: { itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 },
        };
      if (config.url?.endsWith("/assincronas"))
        throw new AxiosError("Network Error", "ERR_NETWORK", config);
      return adapter(config);
    };
    show(
      <MemoryRouter>
        <NuqsAdapter>
          <ThemeProvider defaultTheme="light">
            <Products />
          </ThemeProvider>
        </NuqsAdapter>
      </MemoryRouter>,
    );
    await screen.findByText("Nenhum produto foi adicionado ainda.");
    await screen.findAllByText("minha-fds.pdf");
    expect(document.querySelectorAll('[data-slot="dialog-content"]')).toHaveLength(1);
    for (let attempt = 0; attempt < 2; attempt++) {
      await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
      await waitFor(() =>
        expect(screen.getByRole("region", { name: "Avisos do cadastro" })).toHaveTextContent(
          "Não foi possível analisar a FDS",
        ),
      );
      expect(document.querySelectorAll('[data-slot="dialog-content"]')).toHaveLength(1);
      expect(screen.getByText("minha-fds.pdf")).toBeInTheDocument();
    }
  });
  it("restores the open stage, fields, PDF and corrections after remount and clears after success", async () => {
    const first = show();
    await start();
    fireEvent.change(screen.getByRole("textbox", { name: "Código de barras" }), {
      target: { value: "001234" },
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["%PDF-1.7"], "minha-fds.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("minha-fds.pdf");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Marcar como resolvido" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Unidade de concentração" }), {
      target: { value: "%" },
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "Salvar correção" }));
    await waitFor(() =>
      expect(saved.get(company.id)).toMatchObject({
        open: true,
        view: "review",
        fields: { codBarras: "001234" },
        fds: { corrections: [{ indice: 0, unidadeConcentracao: "%" }], file: expect.any(File) },
      }),
    );
    first.unmount();
    show();
    expect(
      await screen.findByRole("heading", { name: "Pendências identificadas" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como pendência" })).toBeEnabled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    await waitFor(() => expect(saved.has(company.id)).toBe(false));
    expect(
      screen.queryByRole("heading", { name: "Pendências identificadas" }),
    ).not.toBeInTheDocument();
  });
  it("keeps drafts isolated between companies and clears a cancelled draft", async () => {
    show();
    await start();
    await waitFor(() => expect(saved.has(company.id)).toBe(true));
    act(() => useAuthStore.getState().actions.login("other-token", { ...company, id: 9102 }));
    await userEvent.setup().click(await screen.findByRole("button", { name: "Cadastrar produto" }));
    expect(screen.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue("");
    act(() => useAuthStore.getState().actions.login("first-token", company));
    expect(await screen.findByRole("textbox", { name: "Nome", exact: true })).toHaveValue(
      "Produto recuperável",
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "Cancelar", exact: true }));
    await waitFor(() => expect(saved.has(company.id)).toBe(false));
  });
  it("renders API failures as a dismissible toast and retains the PDF without a red error panel", async () => {
    const adapter = api.defaults.adapter as import("axios").AxiosAdapter;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/assincronas"))
        throw new AxiosError("Bad Gateway", "ERR_BAD_RESPONSE", config, undefined, {
          config,
          status: 502,
          statusText: "Bad Gateway",
          data: { detail: "extrator_falhou" },
          headers: new AxiosHeaders(),
        });
      return adapter(config);
    };
    show();
    await start();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["%PDF-1.7"], "minha-fds.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("minha-fds.pdf");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível analisar a FDS");
    const notification = screen.getByRole("alertdialog", { hidden: true });
    act(() => notification.focus());
    expect(notification).toHaveAccessibleName("Não foi possível analisar a FDS");
    expect(within(notification).getByRole("button", { name: "Fechar notificação" })).toBeEnabled();
    expect(screen.getByText("minha-fds.pdf")).toBeInTheDocument();
    expect(document.querySelector('p[role="alert"].bg-feedback-error\\/10')).toBeNull();
  });
  it("allows editing when storage is unavailable and reports that failure by toast", async () => {
    vi.mocked(loadProductDraft).mockRejectedValueOnce(new Error("Denied"));
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /não foi possível recuperar o rascunho/i,
    );
    await start();
    expect(screen.getByRole("textbox", { name: "Nome", exact: true })).toHaveValue(
      "Produto recuperável",
    );
  });
  it("records a submission before the request and never discards its analysis after reload", async () => {
    const adapter = api.defaults.adapter as import("axios").AxiosAdapter;
    const requests: string[] = [];
    api.defaults.adapter = async (config) => {
      requests.push(config.url ?? "");
      if (config.method === "post" && config.url === "/empresas/me/produtos") {
        expect(saved.get(company.id)).toMatchObject({ submissionPending: true });
        return new Promise(() => {});
      }
      return adapter(config);
    };
    const first = show();
    await start();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["%PDF-1.7"], "minha-fds.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("minha-fds.pdf");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    await userEvent
      .setup()
      .click(await screen.findByRole("button", { name: "Adicionar mesmo assim" }));
    await waitFor(() => expect(requests).toContain("/empresas/me/produtos"));
    first.unmount();
    show();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Confira se o produto foi cadastrado",
    );
    expect(await screen.findByText("minha-fds.pdf")).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Fechar cadastro de produto" }));
    await waitFor(() => expect(saved.has(company.id)).toBe(false));
    expect(requests.some((url) => url.endsWith("/descartar"))).toBe(false);
  });
  it("does not send the PDF when it cannot persist the operation marker", async () => {
    const adapter = api.defaults.adapter as import("axios").AxiosAdapter;
    const analyze = vi.fn(adapter);
    api.defaults.adapter = analyze;
    show();
    await start();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["%PDF-1.7"], "minha-fds.pdf", { type: "application/pdf" })] },
    });
    await screen.findByText("minha-fds.pdf");
    vi.mocked(saveProductDraft).mockRejectedValue(new Error("QuotaExceededError"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar", exact: true }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Avisos do cadastro" })).toHaveTextContent(
        "O envio não foi iniciado",
      ),
    );
    expect(analyze.mock.calls.some(([config]) => config.url?.endsWith("/assincronas"))).toBe(false);
    expect(screen.getByText("minha-fds.pdf")).toBeInTheDocument();
  });
});
