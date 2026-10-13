import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Card from "./Card";

describe("Card", () => {
  it("composes its title, description, icon and arbitrary content", () => {
    render(
      <Card
        title="Produtos"
        description="Itens cadastrados"
        icon={<svg role="img" aria-label="Inventário" />}
      >
        <p>3 produtos</p>
      </Card>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Produtos" })).toBeInTheDocument();
    expect(screen.getByText("Itens cadastrados")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Inventário" })).toBeInTheDocument();
    expect(screen.getByText("3 produtos")).toBeInTheDocument();
  });

  it.each([undefined, ""])("omits the entire header for title %s", (title) => {
    render(
      <Card title={title} description="Descrição do cabeçalho" icon={<svg role="img" aria-label="Inventário" />}>
        <p>Conteúdo independente</p>
      </Card>,
    );

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("Descrição do cabeçalho")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Conteúdo independente")).toBeInTheDocument();
  });

  it("preserves keyboard interaction with controls supplied as children", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card title="Produtos"><button onClick={onClick}>Cadastrar</button></Card>);

    await user.tab();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("removes a header when the title is cleared without losing the content", () => {
    const { rerender } = render(<Card title="Produtos"><p>Conteúdo</p></Card>);
    rerender(<Card><p>Conteúdo</p></Card>);

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.getByText("Conteúdo")).toBeInTheDocument();
  });

  it("applies its className to the outer card rather than to the header", () => {
    const { container } = render(<Card title="Produtos" className="max-w-md" />);

    expect(container.firstElementChild).toHaveClass("max-w-md");
    expect(screen.getByRole("heading").closest("hgroup")?.parentElement).not.toHaveClass("max-w-md");
  });
});
