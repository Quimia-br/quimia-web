import { renderWithAuth as render } from "../support/render-with-auth";
import { act, cleanup, fireEvent, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { api } from "@/services/api";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { ThemeProvider } from "@/lib/theme-provider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import Products from "@/pages/Products";

const routers: ReturnType<typeof createBrowserRouter>[] = [];
const clients: QueryClient[] = [];
const originalAdapter = api.defaults.adapter;
function setup(path: string) {
  window.history.replaceState({ idx: 0, key: "products-0" }, "", path);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const router = createBrowserRouter([
    {
      path: "*",
      element: (
        <QueryClientProvider client={client}>
          <NuqsAdapter>
            <ThemeProvider defaultTheme="light" storageKey="products-fields-theme">
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
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
  });
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
  api.defaults.adapter = (config) =>
    Promise.resolve({
      config,
      data: { itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 },
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
});
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  vi.useRealTimers();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Products search fields disclosure", () => {
  it("opens by button with a stable controlled region", () => {
    setup("/products");
    const button = screen.getByRole("button", { name: "Filtros de produtos" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-controls");
    expect(screen.queryByRole("region", { name: "Campos da busca" })).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region", { name: "Campos da busca" });
    expect(button).toHaveAttribute("aria-controls", region.id);
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).not.toHaveAttribute("aria-controls");
  });

  it("opens selected fields from URL and preserves them when closed", async () => {
    const router = setup("/products?q=vitamina&fields=nome%2Ctipo#results");
    const button = screen.getByRole("button", { name: "Filtros de produtos" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tipo" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(router.state.location.search).toBe("?q=vitamina&fields=nome%2Ctipo");
    expect(router.state.location.hash).toBe("#results");
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-pressed", "true");
  });
});
