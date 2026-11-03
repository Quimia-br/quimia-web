import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/services/api";
import { AuthContext } from "@/hooks/use-auth";
import { ThemeProvider } from "@/lib/theme-provider";
import ProductDetail from "@/pages/ProductDetail";

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const product = {
  id: 42,
  nome: "Limpa vidros",
  tipo: "limpeza_geral",
  descricao: "Limpeza de janelas",
  codBarras: "7891234567895",
  fotoUrl: null,
  marca: { id: 1, nome: "Quimia", logoUrl: null },
};

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = {
    config,
    status,
    data,
    statusText: String(status),
    headers: new AxiosHeaders(),
  };
  return status >= 400
    ? Promise.reject(
        new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, response),
      )
    : Promise.resolve(response);
}

function setup(id = "42") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <AuthContext
        value={{
          user: null,
          isAuthenticated: false,
          canRefresh: false,
          sessionVersion: 0,
          isCurrentSession: (version) => version === 0,
          isCurrentCompany: (companyId) => companyId === null,
        }}
      >
        <ThemeProvider defaultTheme="light">
          <MemoryRouter initialEntries={[`/products/${id}`]}>
            <Routes>
              <Route path="/products/:productId" element={<ProductDetail />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </AuthContext>
    </QueryClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
});

describe("Product details", () => {
  it("aborts the pending query when its last consumer unmounts", async () => {
    let aborted = false;
    let started = false;
    api.defaults.adapter = (config) =>
      new Promise(() => {
        started = true;
        config.signal?.addEventListener?.("abort", () => {
          aborted = true;
        });
      });
    const view = setup();
    await waitFor(() => expect(started).toBe(true));
    view.unmount();
    expect(aborted).toBe(true);
  });

  it.each(["invalid", "0", "2147483648"])("does not request an invalid product ID %s", (id) => {
    let requests = 0;
    api.defaults.adapter = (config) => {
      requests++;
      return respond(config, 200, product);
    };
    setup(id);
    expect(screen.getByRole("alert")).toHaveTextContent("identificador de produto inválido");
    expect(screen.getByRole("link", { name: "Voltar para produtos" })).toHaveAttribute(
      "href",
      "/products",
    );
    expect(requests).toBe(0);
  });

  it("announces loading and renders the fetched product", async () => {
    let complete!: () => void;
    api.defaults.adapter = (config) =>
      new Promise((resolve) => {
        expect(config.url).toBe("/produtos/42");
        complete = () => {
          void respond(config, 200, product).then(resolve);
        };
      });
    setup();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando produto...");
    await act(async () => complete());
    expect(await screen.findByRole("heading", { name: product.nome })).toBeVisible();
    expect(screen.getByText("limpeza geral")).toBeVisible();
    expect(screen.getByText(product.codBarras)).toBeVisible();
    expect(screen.getByText(product.descricao)).toBeVisible();
    expect(screen.getByText(product.marca.nome)).toBeVisible();
  });

  it("shows missing metadata fallbacks", async () => {
    api.defaults.adapter = (config) =>
      respond(config, 200, { ...product, tipo: null, codBarras: null, descricao: null });
    setup();
    await screen.findByRole("heading", { name: product.nome });
    expect(screen.getAllByText("Não informado")).toHaveLength(2);
    expect(screen.getByText("Sem descrição")).toBeVisible();
  });

  it("shows a missing product without offering a retry", async () => {
    api.defaults.adapter = (config) => respond(config, 404, { detail: "produto_nao_encontrado" });
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent("Produto não encontrado.");
    expect(screen.queryByRole("button", { name: "Tentar novamente" })).not.toBeInTheDocument();
  });

  it("lets the user retry a failed product request", async () => {
    api.defaults.adapter = (config) => respond(config, 500, {});
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar o produto.",
    );
    api.defaults.adapter = (config) => respond(config, 200, product);
    await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: product.nome })).toBeVisible();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
