import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { authKeys } from "@/hooks/use-user";
import { SidebarProvider } from "@/components/ui/sidebar";
import Menu from "@/components/Menu";
import Header from "@/components/Header";
import { ThemeProvider } from "@/lib/theme-provider";

const clients: QueryClient[] = [];

afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});

function MenuPath() {
  return <output aria-label="Menu route">{useLocation().pathname}</output>;
}

function renderMenu(path: string, mobile = false) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: mobile && query.includes("max-width"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity } } });
  clients.push(client);
  client.setQueryData(authKeys.user(), {
    id: 12,
    nome: "Quimia",
    cnpj: "12345678000100",
    email: "quimia@example.com",
    fotoUrl: "",
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <SidebarProvider>
          <Menu />
          {mobile && (
            <ThemeProvider>
              <Header title="Produtos" />
            </ThemeProvider>
          )}
        </SidebarProvider>
        <MenuPath />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("Menu", () => {
  it("opens the mobile navigation and closes after selecting a destination", async () => {
    const user = userEvent.setup();
    renderMenu("/products", true);
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Menu principal" })).toHaveAttribute(
      "id",
      trigger.getAttribute("aria-controls"),
    );
    await user.click(screen.getByRole("link", { name: "Estatísticas" }));
    expect(screen.getByRole("status", { name: "Menu route" })).toHaveTextContent("/graphs");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Home" })).not.toBeInTheDocument();
  });

  it("closes the mobile navigation with Escape and restores trigger focus", async () => {
    const user = userEvent.setup();
    renderMenu("/products", true);
    const trigger = screen.getByRole("button", { name: "Abrir menu" });
    await user.click(trigger);
    screen.getByRole("link", { name: "Home" }).focus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

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
    expect(screen.getByRole("link", { name: "Estatísticas" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
  });
});
