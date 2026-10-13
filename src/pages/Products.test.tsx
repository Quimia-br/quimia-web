import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { ThemeProvider } from "@/lib/theme-provider";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Products from "./Products";

const routers: ReturnType<typeof createBrowserRouter>[] = [];
function setup(path: string) {
  window.history.replaceState({ idx: 0, key: "products-0" }, "", path);
  const router = createBrowserRouter([{ path: "*", element: <NuqsAdapter><ThemeProvider defaultTheme="light" storageKey="products-fields-theme"><Products /></ThemeProvider></NuqsAdapter> }]);
  routers.push(router);
  render(<RouterProvider router={router} />);
  return router;
}
beforeEach(() => vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] }));
afterEach(() => { cleanup(); routers.splice(0).forEach(router => router.dispose()); vi.useRealTimers(); localStorage.clear(); });

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
    const router = setup("/products?q=vitamina&fields=name%2Ctype#results");
    const button = screen.getByRole("button", { name: "Filtros de produtos" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Tipo" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(button);
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(router.state.location.search).toBe("?q=vitamina&fields=name%2Ctype");
    expect(router.state.location.hash).toBe("#results");
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: "Nome" })).toHaveAttribute("aria-pressed", "true");
  });
});
