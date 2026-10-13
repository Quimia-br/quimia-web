import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import type { ComponentProps } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import Header from "./Header";

beforeEach(() => localStorage.removeItem("header-test-theme"));
function renderHeader(props: ComponentProps<typeof Header>) {
  return render(<ThemeProvider defaultTheme="light" storageKey="header-test-theme"><Header {...props} /></ThemeProvider>);
}

describe("Header", () => {
  it("uses MainTitle for the page heading and optional description", () => {
    renderHeader({ title: "Produtos cadastrados", description: "Gerencie seu catálogo" });
    expect(screen.getByRole("heading", { level: 1, name: "Produtos cadastrados" })).toBeVisible();
    expect(screen.getByText("Gerencie seu catálogo")).toBeVisible();
  });

  it("includes theme control without adding a search or description", () => {
    renderHeader({ title: "Home" });
    expect(screen.getByRole("heading", { name: "Home" })).toBeVisible();
    expect(screen.queryByRole("searchbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alternar para tema escuro" })).toBeVisible();
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("lets the theme control switch themes through mouse and keyboard", async () => {
    const user = userEvent.setup();
    renderHeader({ title: "Produtos" });
    await user.click(screen.getByRole("button", { name: "Alternar para tema escuro" }));
    expect(screen.getByRole("button", { name: "Alternar para tema claro" })).toBeVisible();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Alternar para tema escuro" })).toBeVisible();
  });

  it("forwards native header attributes and custom classes to its outer element", () => {
    renderHeader({ title: "Perfil", "aria-label": "Cabeçalho do perfil", id: "profile-header", className: "custom-header" });
    const header = screen.getByRole("banner", { name: "Cabeçalho do perfil" });
    expect(header).toHaveAttribute("id", "profile-header");
    expect(header).toHaveClass("custom-header");
    expect(screen.getByRole("heading", { name: "Perfil" })).not.toHaveClass("custom-header");
  });
});
