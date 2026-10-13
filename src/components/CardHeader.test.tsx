import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CardHeader from "./CardHeader";

describe("CardHeader", () => {
  it("exposes the card title as a second-level heading with its supporting text", () => {
    render(<CardHeader title="Produtos" description="Itens disponíveis" />);

    expect(screen.getByRole("heading", { level: 2, name: "Produtos" })).toBeInTheDocument();
    expect(screen.getByText("Itens disponíveis", { selector: "p" })).toBeInTheDocument();
  });

  it.each([undefined, ""])("omits the description when it is %s", (description) => {
    const { container } = render(<CardHeader title="Produtos" description={description} />);

    expect(screen.getByRole("heading", { name: "Produtos" })).toBeInTheDocument();
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("preserves the accessibility attributes supplied on the optional icon", () => {
    render(<CardHeader title="Produtos" icon={<svg role="img" aria-label="Inventário" />} />);

    expect(screen.getByRole("img", { name: "Inventário" })).toBeInTheDocument();
  });

  it("updates the title, description and icon when its props change", () => {
    const { rerender } = render(<CardHeader title="Produtos" description="Antiga" icon={<svg role="img" aria-label="Inventário" />} />);
    rerender(<CardHeader title="Resumo" description="Nova" />);

    expect(screen.queryByRole("heading", { name: "Produtos" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Resumo" })).toBeInTheDocument();
    expect(screen.queryByText("Antiga")).not.toBeInTheDocument();
    expect(screen.getByText("Nova")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("applies custom layout classes to the header container", () => {
    const { container } = render(<CardHeader title="Produtos" className="max-w-md" />);

    expect(container.firstElementChild).toHaveClass("max-w-md");
  });
});
