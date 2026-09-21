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
});
