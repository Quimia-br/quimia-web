import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LinkButton from "./LinkButton";

function Destination() {
  const location = useLocation();
  return <output aria-label="Destination">{location.pathname}:{location.state?.source}</output>;
}

describe("LinkButton", () => {
  it("preserves children and link semantics with its default text-link appearance", () => {
    render(
      <MemoryRouter>
        <LinkButton to="/signup"><span>Criar conta</span></LinkButton>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Criar conta" });
    expect(link).toHaveAttribute("href", "/signup");
    expect(link).toHaveClass("hover:underline", "text-base");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("navigates with Enter while forwarding router state", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LinkButton to="/signup" state={{ source: "login" }}>Criar conta</LinkButton>
        <Destination />
      </MemoryRouter>,
    );

    await user.tab();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status", { name: "Destination" })).toHaveTextContent("/signup:login");
  });

  it("allows a button-like variant and anchor attributes without losing its label", () => {
    render(
      <MemoryRouter>
        <LinkButton to="/products" variant="secondary" size="lg" className="custom-link" target="_blank" rel="noopener">
          Produtos
        </LinkButton>
      </MemoryRouter>,
    );

    const link = screen.getByRole("link", { name: "Produtos" });
    expect(link).toHaveClass("custom-link", "bg-secondary-primary", "h-9");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
  });
});
