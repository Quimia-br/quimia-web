import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ChartSkeleton from "./ChartSkeleton";

describe("ChartSkeleton", () => {
  it("announces loading once and hides decorative placeholders", () => {
    render(<ChartSkeleton />);
    const status = screen.getByRole("status", { name: "Carregando gráfico" });
    expect(status).toHaveAttribute("aria-busy", "true");
    expect(status).toHaveTextContent("Carregando gráfico");
    expect(status.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    for (const placeholder of status.querySelectorAll('[data-slot="skeleton"]')) {
      expect(placeholder).toHaveAttribute("aria-hidden", "true");
      expect(placeholder).toHaveClass("motion-reduce:animate-none");
    }
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("supports a named loading state, optional caption and plot sizing without using Chart", () => {
    const ref = createRef<HTMLDivElement>();
    render(<ChartSkeleton label="Carregando vendas" showCaption={false} contentClassName="h-32" className="custom-layout" id="loading-sales" ref={ref} />);
    const status = screen.getByRole("status", { name: "Carregando vendas" });
    expect(status).toBe(ref.current);
    expect(status).toHaveAttribute("id", "loading-sales");
    expect(status).toHaveClass("custom-layout");
    const placeholders = status.querySelectorAll('[data-slot="skeleton"]');
    expect(placeholders).toHaveLength(2);
    expect(placeholders[1]).toHaveClass("h-32");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });
});
