import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/lib/api";
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
