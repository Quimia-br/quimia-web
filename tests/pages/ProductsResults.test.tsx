import { renderWithAuth as render } from "../support/render-with-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/services/api";
import { ThemeProvider } from "@/lib/theme-provider";
import Products from "@/pages/Products";

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const routers: ReturnType<typeof createBrowserRouter>[] = [];
const product = {
  id: 42,
  nome: "Limpa vidros",
  tipo: "limpeza_geral",
  descricao: "Limpeza de janelas",
  codBarras: "7891234567895",
  fotoUrl: null,
  marca: { id: 1, nome: "Quimia", logoUrl: null },
};
const page = { itens: [product], pagina: 0, tamanho: 20, totalItens: 21, totalPaginas: 2 };
const requests: InternalAxiosRequestConfig[] = [];
function respond(config: InternalAxiosRequestConfig, data: unknown = page) {
  requests.push(config);
  return Promise.resolve({
    config,
    data,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
}

function setup(path = "/products") {
  window.history.replaceState({ idx: 0, key: "results-0" }, "", path);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
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
  return router;
}

beforeEach(() => {
  requests.length = 0;
  api.defaults.adapter = (config) => respond(config);
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
});
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Products results", () => {
  it.each(["table", "grid"])(
    "edits the selected product from the %s and refreshes results",
    async (display) => {
      const user = userEvent.setup();
      let current = product;
      api.defaults.adapter = (config) => {
        if (config.method === "patch") {
          expect(config.url).toBe("/empresas/me/produtos/42");
          expect(config.data).toBeInstanceOf(FormData);
          expect(config.data.get("nome")).toBe("Limpa vidros novo");
          current = { ...product, nome: config.data.get("nome") };
          return respond(config, current);
        }
        if (config.url?.endsWith("/tipos")) return respond(config, ["limpeza_geral"]);
        return respond(config, { ...page, itens: [current] });
      };
      setup();
      await screen.findByText(product.nome);
      if (display === "grid")
        await user.click(
          screen.getByRole("button", { name: "Alternar para visualização em grade" }),
        );
      await user.click(screen.getByRole("button", { name: `Editar ${product.nome}` }));
      const dialog = await screen.findByRole("dialog", { name: "Editar produto" });
      const name = within(dialog).getByRole("textbox", { name: "Nome" });
      expect(name).toHaveValue(product.nome);
      await user.clear(name);
      await user.type(name, "Limpa vidros novo");
      await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: "Editar produto" })).not.toBeInTheDocument(),
      );
      expect(await screen.findByText("Limpa vidros novo")).toBeInTheDocument();
    },
  );

  it.each(["table", "grid"])(
    "confirms deletion from the %s before removing the product",
    async (display) => {
      const user = userEvent.setup();
      let deleted = false;
      api.defaults.adapter = (config) => {
        if (config.method === "delete") {
          expect(config.url).toBe("/empresas/me/produtos/42");
          deleted = true;
          return respond(config, null);
        }
        return respond(
          config,
          deleted ? { ...page, itens: [], totalItens: 0, totalPaginas: 0 } : page,
        );
      };
      setup();
      await screen.findByText(product.nome);
      if (display === "grid")
        await user.click(
          screen.getByRole("button", { name: "Alternar para visualização em grade" }),
        );
      await user.click(screen.getByRole("button", { name: `Excluir ${product.nome}` }));
      let dialog = await screen.findByRole("dialog", { name: "Excluir produto" });
      expect(within(dialog).getByText(/Limpa vidros/)).toBeInTheDocument();
      expect(deleted).toBe(false);
      await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
      expect(deleted).toBe(false);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: `Excluir ${product.nome}` }));
      dialog = await screen.findByRole("dialog", { name: "Excluir produto" });
      await user.click(within(dialog).getByRole("button", { name: "Excluir produto" }));
      expect(
        await screen.findByRole("heading", { name: "Nenhum produto foi adicionado ainda." }),
      ).toBeInTheDocument();
      expect(requests.filter((request) => request.method === "delete")).toHaveLength(1);
    },
  );

  it("keeps the edit open with entered data after an API failure", async () => {
    const user = userEvent.setup();
    api.defaults.adapter = (config) => {
      if (config.method === "patch") {
        requests.push(config);
        return Promise.reject(new AxiosError("Network Error", "ERR_NETWORK", config));
      }
      return respond(config, config.url?.endsWith("/tipos") ? ["limpeza_geral"] : page);
    };
    setup();
    await screen.findByText(product.nome);
    await user.click(screen.getByRole("button", { name: `Editar ${product.nome}` }));
    const dialog = await screen.findByRole("dialog", { name: "Editar produto" });
    const name = within(dialog).getByRole("textbox", { name: "Nome" });
    await user.clear(name);
    await user.type(name, "Nome corrigido");
    await user.click(within(dialog).getByRole("button", { name: "Salvar alterações" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Não foi possível salvar");
    expect(name).toHaveValue("Nome corrigido");
    expect(within(dialog).getByRole("button", { name: "Salvar alterações" })).toBeEnabled();
  });

  it("blocks duplicate deletion and closing while saving, then keeps errors retryable", async () => {
    const user = userEvent.setup();
    let rejectDelete!: () => void;
    api.defaults.adapter = (config) => {
      if (config.method !== "delete") return respond(config);
      requests.push(config);
      return new Promise((_resolve, reject) => {
        rejectDelete = () => reject(new AxiosError("Network Error", "ERR_NETWORK", config));
      });
    };
    setup();
    await screen.findByText(product.nome);
    await user.click(screen.getByRole("button", { name: `Excluir ${product.nome}` }));
    const dialog = await screen.findByRole("dialog", { name: "Excluir produto" });
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toHaveFocus();
    await user.click(within(dialog).getByRole("button", { name: "Excluir produto" }));
    expect(within(dialog).getByRole("button", { name: "Excluindo…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    await act(async () => rejectDelete());
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Não foi possível excluir");
    expect(within(dialog).getByRole("button", { name: "Excluir produto" })).toBeEnabled();
    expect(requests.filter((request) => request.method === "delete")).toHaveLength(1);
  });

  it("uses the URL filters and page for both displays without fetching on toggle", async () => {
    const router = setup("/products?q=limpa&fields=nome&p=2");
    const table = await screen.findByRole("table", { name: "Produtos cadastrados" });
    expect(await within(table).findByText("Limpa vidros")).toBeInTheDocument();
    expect(requests[0].params).toMatchObject({ q: "limpa", fields: "nome", page: 1, size: 20 });

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Alternar para visualização em grade" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("list", { name: "Produtos cadastrados" })).getByRole("heading", {
        name: "Limpa vidros",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Ver detalhes/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Limpa vidros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir Limpa vidros" })).toBeInTheDocument();
    expect(requests).toHaveLength(1);
    expect(router.state.location.search).toContain("p=2");
    expect(
      screen
        .getByRole("region", { name: "Resultados de produtos" })
        .querySelector('[data-slot="scroll-area"]'),
    ).toBeInTheDocument();
  });

  it("applies chips with OR semantics and resets pagination with the filter", async () => {
    const router = setup("/products?q=limpa&fields=nome&p=2");
    await screen.findByText("Limpa vidros");
    await userEvent.setup().click(screen.getByRole("button", { name: "Tipo" }));
    await waitFor(() =>
      expect(requests.at(-1)?.params).toMatchObject({ q: "limpa", fields: "nome,tipo", page: 0 }),
    );
    expect(new URLSearchParams(router.state.location.search).has("p")).toBe(false);
    expect(requests).toHaveLength(2);
  });

  it("searches all supported fields by default and debounces the search before requesting", async () => {
    setup();
    await screen.findByText("Limpa vidros");
    expect(requests[0].params.fields).toBe("nome,tipo,codBarras");
    await userEvent.setup().type(screen.getByRole("searchbox"), "lavanda");
    await waitFor(() => expect(requests.at(-1)?.params.q).toBe("lavanda"));
    expect(requests).toHaveLength(2);
  });

  it("uses server pagination and repairs a stale page after results shrink", async () => {
    api.defaults.adapter = (config) =>
      respond(
        config,
        config.params?.page === 4
          ? { ...page, itens: [], totalItens: 1, totalPaginas: 1 }
          : { ...page, totalItens: 1, totalPaginas: 1 },
      );
    const router = setup("/products?p=5");
    await screen.findByText("Limpa vidros");
    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).has("p")).toBe(false),
    );
    expect(requests.map((request) => request.params.page)).toEqual([4, 0]);
  });

  it("shows errors with a working retry and then the empty state", async () => {
    api.defaults.adapter = (config) =>
      Promise.reject(new AxiosError("Network Error", "ERR_NETWORK", config));
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os produtos",
    );
    api.defaults.adapter = (config) =>
      respond(config, { ...page, itens: [], totalItens: 0, totalPaginas: 0 });
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(
      await screen.findByRole("heading", { name: "Nenhum produto foi adicionado ainda." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces loading while the initial request is pending", async () => {
    let complete!: () => void;
    api.defaults.adapter = (config) =>
      new Promise((done) => {
        complete = () => {
          void respond(config).then(done);
        };
      });
    setup();
    expect(await screen.findByText("Carregando dados...")).toBeInTheDocument();
    await act(async () => {
      complete();
    });
    expect(await screen.findByText("Limpa vidros")).toBeInTheDocument();
  });
});
