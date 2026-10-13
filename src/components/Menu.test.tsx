import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authKeys } from "@/hooks/use-user";
import { SidebarProvider } from "./ui/sidebar";
import Menu from "./Menu";

const clients: QueryClient[] = [];

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});

function MenuPath() {
  return <output aria-label="Menu route">{useLocation().pathname}</output>;
}

function renderMenu(path: string) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  clients.push(client);
  client.setQueryData(authKeys.user(), {
    id: 12, nome: "Quimia", cnpj: "12345678000100", email: "quimia@example.com", fotoUrl: "",
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <SidebarProvider><Menu /></SidebarProvider>
        <MenuPath />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Menu", () => {
  it.each([
    ["/", "Home"],
    ["/products/12", "Produtos"],
    ["/graphs", "Estatísticas"],
    ["/profile/edit", "Perfil"],
  ])("exposes all destinations and only marks %s active", (path, activeLabel) => {
    renderMenu(path);
    const links = screen.getAllByRole("link");

    expect(links).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Produtos" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Estatísticas" })).toHaveAttribute("href", "/graphs");
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("href", "/profile");
    expect(links.filter((link) => link.getAttribute("aria-current") === "page")).toEqual([
      screen.getByRole("link", { name: activeLabel }),
    ]);
  });

  it("navigates through its real section links", async () => {
    const user = userEvent.setup();
    renderMenu("/");

    await user.click(screen.getByRole("link", { name: "Estatísticas" }));
    expect(screen.getByRole("status", { name: "Menu route" })).toHaveTextContent("/graphs");
    expect(screen.getByRole("link", { name: "Estatísticas" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });
});
