import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FeedbackItem from "./FeedbackItem";

describe("FeedbackItem", () => {
  it("renders the supplied icon with its accessible name using default props", () => {
    render(<FeedbackItem icon={<svg role="img" aria-label="Operação concluída" />} />);

    expect(screen.getByRole("img", { name: "Operação concluída" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    { variant: "success" as const, size: "big" as const, label: "Concluído" },
    { variant: "error" as const, size: "medium" as const, label: "Falha" },
    { variant: "default" as const, size: "small" as const, label: "Aguardando" },
  ])("preserves icon semantics for $variant/$size", ({ variant, size, label }) => {
    render(<FeedbackItem variant={variant} size={size} icon={<svg role="img" aria-label={label} />} />);

    expect(screen.getByRole("img", { name: label })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("allows an icon to be decorative when nearby text conveys the result", () => {
    render(
      <section>
        <FeedbackItem variant="error" icon={<svg aria-hidden="true" />} />
        <h1>Verifique sua conexão</h1>
      </section>,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Verifique sua conexão" })).toBeInTheDocument();
  });

  it("replaces its icon when the displayed result changes", () => {
    const { rerender } = render(<FeedbackItem variant="success" icon={<svg role="img" aria-label="Concluído" />} />);
    rerender(<FeedbackItem variant="error" icon={<svg role="img" aria-label="Falha" />} />);

    expect(screen.queryByRole("img", { name: "Concluído" })).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Falha" })).toBeInTheDocument();
  });

  it("accepts custom presentation classes on the outer container", () => {
    const { container } = render(<FeedbackItem className="mx-auto" icon={<svg aria-hidden="true" />} />);

    expect(container.firstElementChild).toHaveClass("mx-auto");
  });
});
