import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/lib/api";
import { ThemeProvider } from "@/lib/theme-provider";
import Products from "@/pages/Products";
import { cleanAnalysis } from "../fixtures/fds";

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const routers: ReturnType<typeof createBrowserRouter>[] = [];
const product = {
  id: 42,
  nome: "Limpa vidros",
  tipo: "limpeza_geral",
  descricao: null,
  codBarras: null,
  fotoUrl: null,
  marca: { id: 1, nome: "Quimia", logoUrl: null },
};
const emptyPage = { itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 };
const validTypes = [
  "limpeza_geral",
  "desinfetante",
  "desincrustante",
  "desengraxante",
  "alvejante",
  "aromatizante",
  "outro",
];

function respond(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return { config, data, status, statusText: String(status), headers: new AxiosHeaders() };
}

function setup(typesAdapter?: AxiosAdapter) {
  const productsAdapter = api.defaults.adapter as AxiosAdapter;
  api.defaults.adapter = async (config) => {
    if (config.url === "/empresas/me/produtos/fds/analises") {
      return respond(config, cleanAnalysis);
    }
    if (config.url === "/empresas/me/produtos/tipos") {
      return typesAdapter ? typesAdapter(config) : respond(config, validTypes);
    }
    return productsAdapter(config);
  };
  window.history.replaceState({}, "", "/products");
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: false } },
  });
  clients.push(client);
  const router = createBrowserRouter([
    {
      path: "*",
      element: (
        <QueryClientProvider client={client}>
          <NuqsAdapter>
            <ThemeProvider defaultTheme="light">
              <Products />
            </ThemeProvider>
          </NuqsAdapter>
        </QueryClientProvider>
      ),
    },
  ]);
  routers.push(router);
  render(<RouterProvider router={router} />);
}

async function openForm() {
  await userEvent.setup().click(screen.getByRole("button", { name: "Cadastrar produto" }));
  return screen.getByRole("dialog", { name: "Cadastrar novo produto" });
}

async function fillRequired(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByRole("textbox", { name: "Nome" }), {
    target: { value: "Limpa vidros" },
  });
  const user = userEvent.setup();
  const type = within(dialog).getByRole("combobox", { name: "Tipo" });
  await waitFor(() => expect(type).toBeEnabled());
  await user.click(type);
  await user.click(await screen.findByRole("option", { name: "Limpeza geral" }));
}

async function save(dialog: HTMLElement) {
  const user = userEvent.setup();
  const name = within(dialog).queryByRole("textbox", { name: "Nome" });
  if (name) {
    await user.click(within(dialog).getByRole("button", { name: "Continuar", exact: true }));
    if (within(dialog).queryByRole("textbox", { name: "Nome" })) return;
    fireEvent.change(within(dialog).getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["%PDF-1.7\nFDS"], "ficha.pdf", { type: "application/pdf" })] },
    });
    await within(dialog).findByText("ficha.pdf");
    await user.click(within(dialog).getByRole("button", { name: "Continuar", exact: true }));
    await within(dialog).findByText("Nenhuma pendência foi encontrada.");
  }
  await user.click(within(dialog).getByRole("button", { name: "Continuar", exact: true }));
}

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
  }));
  api.defaults.adapter = async (config) => respond(config, emptyPage);
});

afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Web product creation", () => {
  it("shows a loading failure instead of an empty catalog when the API returns HTML", async () => {
    api.defaults.adapter = async (config) =>
      respond(config, "<html><title>Erro Interno</title></html>");
    setup();
    expect(await screen.findByText("Não foi possível carregar os produtos.")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum produto foi adicionado ainda.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeEnabled();
  });

  it("opens the same registration dialog from the empty state and the header", async () => {
    setup();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Adicionar produto", exact: true }));
    expect(screen.getByRole("dialog", { name: "Cadastrar novo produto" })).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="dialog-content"]')).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Cancelar", exact: true }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cadastrar novo produto" }),
      ).not.toBeInTheDocument(),
    );
    await openForm();
    expect(document.querySelectorAll('[data-slot="dialog-content"]')).toHaveLength(1);
  });
  it("saves with FDS after review and refreshes even a fresh product list", async () => {
    let saved = false;
    api.defaults.adapter = async (config) => {
      if (config.method === "post") {
        expect(config.url).toBe("/empresas/me/produtos");
        expect(Object.fromEntries((config.data as FormData).entries())).toEqual({
          nome: "Limpa vidros",
          tipo: "limpeza_geral",
          descricao: "Limpeza de janelas",
          codBarras: "0012345678905",
          analiseFds: "analise-1",
        });
        saved = true;
        return respond(
          config,
          {
            produto: { ...product, descricao: "Limpeza de janelas", codBarras: "0012345678905" },
            situacao: "criado",
          },
          201,
        );
      }
      return respond(
        config,
        saved ? { ...emptyPage, itens: [product], totalItens: 1, totalPaginas: 1 } : emptyPage,
      );
    };
    setup();
    const dialog = await openForm();
    expect(within(dialog).getByRole("textbox", { name: "Nome" })).toBeVisible();
    await fillRequired(dialog);
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Descrição" }), {
      target: { value: " Limpeza de janelas " },
    });
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Código de barras" }), {
      target: { value: "0012345678905" },
    });
    await save(dialog);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cadastrar novo produto" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      await within(screen.getByRole("region", { name: "Resultados de produtos" })).findByText(
        "Limpa vidros",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Produto adicionado com sucesso!")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Nenhum produto foi adicionado ainda." }),
    ).not.toBeInTheDocument();
  });

  it("requires name and type and validates a supplied barcode before sending", async () => {
    let posts = 0;
    api.defaults.adapter = async (config) => {
      if (config.method === "post") posts++;
      return respond(config, emptyPage);
    };
    setup();
    const dialog = await openForm();
    const submit = within(dialog).getByRole("button", { name: "Continuar", exact: true });
    expect(submit).toBeDisabled();
    await fillRequired(dialog);
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Código de barras" }), {
      target: { value: "abc" },
    });
    await userEvent.setup().click(submit);
    expect(within(dialog).getByRole("textbox", { name: "Código de barras" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(within(dialog).getByRole("alert")).toHaveTextContent(/dígitos/);
    expect(posts).toBe(0);
  });

  it("validates on blur and keeps the barcode error until the value is valid", async () => {
    setup();
    const dialog = await openForm();
    await fillRequired(dialog);
    const barcode = within(dialog).getByRole("textbox", { name: "Código de barras" });
    fireEvent.change(barcode, { target: { value: "abc" } });
    fireEvent.blur(barcode);
    expect(barcode).toHaveAttribute("aria-invalid", "true");
    expect(within(dialog).getByRole("alert")).toHaveTextContent(/dígitos/);
    fireEvent.change(barcode, { target: { value: "abc1" } });
    expect(barcode).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(barcode, { target: { value: "001234" } });
    expect(barcode).toHaveAttribute("aria-invalid", "false");
    fireEvent.change(barcode, { target: { value: "\t001234" } });
    fireEvent.blur(barcode);
    expect(barcode).toHaveAttribute("aria-invalid", "true");
    await userEvent
      .setup()
      .click(within(dialog).getByRole("button", { name: "Continuar", exact: true }));
    expect(barcode).toBeVisible();
  });

  it("keeps values after an API failure so the user can correct and retry", async () => {
    let attempts = 0;
    api.defaults.adapter = async (config) => {
      if (config.method !== "post") return respond(config, emptyPage);
      attempts++;
      if (attempts === 1)
        throw new AxiosError(
          "Conflict",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          respond(config, { detail: "produto_ja_cadastrado" }, 409),
        );
      expect(Object.fromEntries((config.data as FormData).entries())).toEqual({
        nome: "Limpa vidros",
        tipo: "limpeza_geral",
        analiseFds: "analise-1",
      });
      return respond(config, { produto: product, situacao: "vinculado" });
    };
    setup();
    const dialog = await openForm();
    await fillRequired(dialog);
    await save(dialog);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/já está cadastrado/);
    expect(within(dialog).getByRole("button", { name: "Editar dados do produto" })).toBeEnabled();
    await save(dialog);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cadastrar novo produto" }),
      ).not.toBeInTheDocument(),
    );
    expect(await screen.findByText("Produto vinculado com sucesso!")).toBeInTheDocument();
  });

  it("prevents repeat submissions and closing while a save is pending", async () => {
    let release: (() => void) | undefined;
    let posts = 0;
    api.defaults.adapter = async (config) => {
      if (config.method !== "post") return respond(config, emptyPage);
      posts++;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return respond(config, { produto: product, situacao: "criado" }, 201);
    };
    setup();
    const dialog = await openForm();
    await fillRequired(dialog);
    await save(dialog);
    expect(await within(dialog).findByRole("button", { name: /Adicionando/ })).toBeDisabled();
    expect(
      within(dialog).getByRole("button", { name: "Fechar cadastro de produto" }),
    ).toBeDisabled();
    await userEvent.setup().keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    expect(posts).toBe(1);
    await act(async () => {
      release?.();
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cadastrar novo produto" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("discards the cancelled draft and returns focus to the add button", async () => {
    setup();
    const dialog = await openForm();
    await fillRequired(dialog);
    await userEvent.setup().click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Cadastrar produto" })).toHaveFocus();
    const reopened = await openForm();
    expect(within(reopened).getByRole("textbox", { name: "Nome" })).toHaveValue("");
    expect(within(reopened).getByRole("combobox", { name: "Tipo" })).toHaveTextContent("Selecione");
  });

  it("offers only API-supported types and sends the code instead of the displayed label", async () => {
    let submittedType: string | undefined;
    api.defaults.adapter = async (config) => {
      if (config.method !== "post") return respond(config, emptyPage);
      submittedType = (config.data as FormData).get("tipo") as string;
      return respond(
        config,
        { produto: { ...product, tipo: submittedType }, situacao: "criado" },
        201,
      );
    };
    setup();
    const dialog = await openForm();
    const select = within(dialog).getByRole("combobox", { name: "Tipo" });
    await waitFor(() => expect(select).toBeEnabled());
    await userEvent.setup().click(select);
    const list = await screen.findByRole("listbox");
    expect(select).toHaveAttribute("aria-invalid", "false");
    expect(
      within(list)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([
      "Limpeza geral",
      "Desinfetante",
      "Desincrustante",
      "Desengraxante",
      "Alvejante",
      "Aromatizante",
      "Outro",
    ]);
    await userEvent.setup().click(within(list).getByRole("option", { name: "Desinfetante" }));
    fireEvent.change(within(dialog).getByRole("textbox", { name: "Nome" }), {
      target: { value: "Desinfetante" },
    });
    await save(dialog);
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Cadastrar novo produto" }),
      ).not.toBeInTheDocument(),
    );
    expect(submittedType).toBe("desinfetante");
  });

  it("explains tipo_invalido from the API and preserves the form for correction", async () => {
    api.defaults.adapter = async (config) => {
      if (config.method !== "post") return respond(config, emptyPage);
      throw new AxiosError(
        "Bad Request",
        "ERR_BAD_REQUEST",
        config,
        undefined,
        respond(config, { detail: "tipo_invalido" }, 400),
      );
    };
    setup();
    const dialog = await openForm();
    await fillRequired(dialog);
    await save(dialog);
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/tipo.*válido/i);
    await userEvent
      .setup()
      .click(within(dialog).getByRole("button", { name: "Editar dados do produto" }));
    expect(within(dialog).getByRole("textbox", { name: "Nome" })).toHaveValue("Limpa vidros");
  });

  it("keeps product fields inside ScrollArea and the actions outside the scroll viewport", async () => {
    setup();
    const dialog = await openForm();
    const region = within(dialog).getByRole("region", { name: "Dados do produto" });
    const viewport = region.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toContainElement(within(dialog).getByRole("textbox", { name: "Nome" }));
    expect(viewport).toContainElement(
      within(dialog).getByRole("textbox", { name: "Código de barras" }),
    );
    expect(viewport).not.toContainElement(
      within(dialog).getByRole("button", { name: "Continuar", exact: true }),
    );
    expect(viewport).not.toContainElement(within(dialog).getByRole("button", { name: "Cancelar" }));
  });

  it("loads types from the endpoint and blocks registration until a failed request is retried", async () => {
    let attempts = 0;
    setup(async (config) => {
      attempts++;
      if (attempts === 1) throw new AxiosError("Network error", "ERR_NETWORK", config);
      return respond(config, ["aromatizante"]);
    });
    const dialog = await openForm();
    const retry = await within(dialog).findByRole("button", { name: "Recarregar tipos" });
    expect(within(dialog).getByRole("combobox", { name: "Tipo" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Continuar", exact: true })).toBeDisabled();
    await userEvent.setup().click(retry);
    const type = within(dialog).getByRole("combobox", { name: "Tipo" });
    await waitFor(() => expect(type).toBeEnabled());
    await userEvent.setup().click(type);
    expect(await screen.findByRole("option", { name: "Aromatizante" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Limpeza geral" })).not.toBeInTheDocument();
  });
});
