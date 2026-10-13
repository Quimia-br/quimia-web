import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MainTitle from "./MainTitle";

describe("MainTitle", () => {
  it("renders the title as the page heading and shows its description", () => {
    render(<MainTitle title="Dashboard" description="Overview" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("omits the description when none is provided", () => {
    render(<MainTitle title="Dashboard" />);

    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
  });

  it("forwards custom classes to the heading group", () => {
    const { container } = render(
      <MainTitle title="Dashboard" className="max-w-4xl" />,
    );

    expect(container.querySelector("hgroup")).toHaveClass("max-w-4xl");
  });

  it("omits an empty description rather than creating an empty paragraph", () => {
    const { container } = render(<MainTitle title="Dashboard" description="" />);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(container.querySelector("p")).not.toBeInTheDocument();
  });

  it("updates the heading and removes stale supporting text on rerender", () => {
    const { rerender } = render(<MainTitle title="Dashboard" description="Overview" />);
    rerender(<MainTitle title="Produtos" />);

    expect(screen.queryByRole("heading", { name: "Dashboard" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Produtos" })).toBeInTheDocument();
    expect(screen.queryByText("Overview")).not.toBeInTheDocument();
  });

  it("renders text content without interpreting it as HTML", () => {
    const { container } = render(<MainTitle title="<em>Produtos</em>" description="<strong>Disponíveis</strong>" />);

    expect(screen.getByRole("heading", { name: "<em>Produtos</em>" })).toBeInTheDocument();
    expect(screen.getByText("<strong>Disponíveis</strong>")).toBeInTheDocument();
    expect(container.querySelector("em, strong")).not.toBeInTheDocument();
  });
});
