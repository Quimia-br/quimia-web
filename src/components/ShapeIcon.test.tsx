import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Home, Package } from "lucide-react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import ShapeIcon from "./ShapeIcon";

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

describe("ShapeIcon", () => {
  it("names links with their visible labels and hides decorative icons", () => {
    render(
      <MemoryRouter>
        <ul>
          <ShapeIcon to="/" icon={Home} label="Home" />
          <ShapeIcon to="/products" icon={Package} label="Produtos" />
        </ul>
      </MemoryRouter>,
    );

    const home = screen.getByRole("link", { name: "Home" });
    const products = screen.getByRole("link", { name: "Produtos" });
    expect(home).toHaveAttribute("href", "/");
    expect(products).toHaveAttribute("href", "/products");
    expect(home.getAttribute("aria-labelledby")).not.toBe(products.getAttribute("aria-labelledby"));
    expect(home.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("marks a parent section active on a nested route without marking Home", () => {
    render(
      <MemoryRouter initialEntries={["/products/42"]}>
        <ul>
          <ShapeIcon to="/" icon={Home} label="Home" />
          <ShapeIcon to="/products" icon={Package} label="Produtos" />
        </ul>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "Produtos" })).toHaveAttribute("aria-current", "page");
  });

  it("honors an explicit exact route match", () => {
    render(
      <MemoryRouter initialEntries={["/products/42"]}>
        <ul><ShapeIcon to="/products" end icon={Package} label="Produtos" /></ul>
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Produtos" })).not.toHaveAttribute("aria-current");
  });

  it("navigates from keyboard focus and updates its active state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ul><ShapeIcon to="/products" icon={Package} label="Produtos" /></ul>
        <CurrentPath />
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Produtos" });
    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status", { name: "Current path" })).toHaveTextContent("/products");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("combines state-dependent caller classes with its navigation styling", () => {
    render(
      <MemoryRouter initialEntries={["/products"]}>
        <ul>
          <ShapeIcon
            to="/products"
            icon={Package}
            label="Produtos"
            title="Produtos disponíveis"
            className={({ isActive }) => isActive ? "selected-section" : "idle-section"}
          />
        </ul>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Produtos" });
    expect(link).toHaveClass("selected-section", "rounded-full");
    expect(link).toHaveAttribute("title", "Produtos disponíveis");
  });
});
