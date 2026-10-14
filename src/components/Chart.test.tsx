import { createRef, useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { BarChart3 } from "lucide-react";
import { describe, expect, it } from "vitest";
import Chart from "./Chart";

describe("Chart", () => {
  it("names the card from its heading and describes it without labelling the plot as an image", () => {
    render(<Chart title="Vendas" description="Resultados do mês"><div>Conteúdo do gráfico</div></Chart>);
    const card = screen.getByRole("article", { name: "Vendas" });
    const heading = within(card).getByRole("heading", { name: "Vendas", level: 2 });
    expect(card).toHaveAttribute("aria-labelledby", heading.id);
    expect(card).toHaveAccessibleDescription("Resultados do mês");
    expect(within(card).getByText("Conteúdo do gráfico")).toBeInTheDocument();
    expect(card.querySelector("svg")).toBeNull();
    expect(card).not.toHaveAttribute("role", "img");
  });

  it("preserves interactive children through rerenders", () => {
    function Example() {
      const [count, setCount] = useState(0);
      return <Chart title="Evolução" description={String(count)}><button onClick={() => setCount(count + 1)}>Selecionar série</button></Chart>;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Selecionar série" }));
    expect(screen.getByRole("article")).toHaveAccessibleDescription("1");
  });

  it("supports an optional caption, custom icon, heading level and native attributes", () => {
    const ref = createRef<HTMLElement>();
    render(<Chart title="Pedidos" icon={BarChart3} headingLevel={3} captionTitle="+12%" captionDescription="Em relação ao mês anterior" id="orders" className="custom-layout" contentClassName="h-32" ref={ref}><div>Plot</div></Chart>);
    const card = screen.getByRole("article", { name: "Pedidos" });
    expect(card).toBe(ref.current);
    expect(card).toHaveAttribute("id", "orders");
    expect(card).toHaveClass("custom-layout");
    expect(within(card).getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(within(card).getByText("+12%")).toBeInTheDocument();
    expect(within(card).getByText("Em relação ao mês anterior")).toBeInTheDocument();
    expect(card.querySelector("svg")).toBeInTheDocument();
    expect(card.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(card.querySelector("svg")).not.toHaveClass("lucide-circle");
    expect(within(card).getByText("Plot").parentElement).toHaveClass("h-32");
  });

  it("omits absent description, icon and caption and creates unique heading IDs", () => {
    render(<><Chart title="Total" icon={false}><strong>100</strong></Chart><Chart title="Total" icon={false}><strong>200</strong></Chart></>);
    const cards = screen.getAllByRole("article", { name: "Total" });
    expect(cards[0]).not.toHaveAttribute("aria-describedby");
    expect(cards[0].querySelector("svg")).toBeNull();
    expect(cards[0].querySelector("footer")).toBeNull();
    expect(cards[0].getAttribute("aria-labelledby")).not.toBe(cards[1].getAttribute("aria-labelledby"));
  });
});
