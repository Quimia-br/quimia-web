import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BallonMessage from "./BallonMessage";

describe("BallonMessage", () => {
  it("keeps message text and an optional timestamp available to readers", () => {
    render(<BallonMessage message="Seu pedido está pronto." time="14:30" />);
    expect(screen.getByText("Seu pedido está pronto.")).toBeVisible();
    expect(screen.getByText("14:30")).toBeVisible();
  });

  it("does not invent a timestamp when the caller omits it", () => {
    const { container } = render(<BallonMessage message="Olá" />);
    expect(container.querySelector('[data-slot="bubble-time"]')).not.toBeInTheDocument();
    expect(screen.getByText("Olá")).toBeVisible();
  });

  it.each([ ["start", "secondary"], ["end", "default"] ] as const)(
    "uses the %s message direction to select the received/sent design state", (align, variant) => {
      render(<BallonMessage message="Olá" align={align} role="article" aria-label="Mensagem" />);
      expect(screen.getByRole("article", { name: "Mensagem" })).toHaveAttribute("data-align", align);
      expect(screen.getByRole("article", { name: "Mensagem" })).toHaveAttribute("data-variant", variant);
    },
  );

  it("lets the caller override the visual variant independently of direction", () => {
    render(<BallonMessage message="Erro no envio" align="end" variant="destructive" role="article" aria-label="Falha" />);
    expect(screen.getByRole("article", { name: "Falha" })).toHaveAttribute("data-variant", "destructive");
  });

  it("renders markup-like messages as plain text instead of injecting elements", () => {
    const message = '<img src="x" onerror="alert(1)">';
    const { container } = render(<BallonMessage message={message} />);
    expect(screen.getByText(message)).toBeVisible();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("preserves authored line breaks and native accessibility attributes", () => {
    const { container } = render(<BallonMessage message={"Linha 1\nLinha 2"} align="end" lang="pt-BR" aria-label="Mensagem enviada" />);
    expect(container.querySelector('[data-slot="bubble-content"]')?.textContent).toBe("Linha 1\nLinha 2");
    expect(screen.getByLabelText("Mensagem enviada")).toHaveAttribute("lang", "pt-BR");
  });
});
