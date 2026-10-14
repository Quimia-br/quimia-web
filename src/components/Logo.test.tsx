import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Logo from "./Logo";

describe("Logo", () => {
  it("keeps the decorative brand mark out of the accessibility tree", () => {
    const { container } = render(<Logo />);

    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("does not make the decorative SVG a keyboard focus target", () => {
    const { container } = render(<Logo />);

    expect(container.querySelector("svg")).toHaveAttribute("focusable", "false");
    expect(container.querySelector("[tabindex]")).not.toBeInTheDocument();
  });

  it("accepts presentation classes without changing its intrinsic proportions", () => {
    const { container, rerender } = render(<Logo className="w-24" />);

    expect(container.querySelector("svg")).toHaveClass("w-24");
    const viewBox = container.querySelector("svg")?.getAttribute("viewBox");
    rerender(<Logo className="w-48" />);

    expect(container.querySelector("svg")).toHaveClass("w-48");
    expect(container.querySelector("svg")).not.toHaveClass("w-24");
    expect(container.querySelector("svg")).toHaveAttribute("viewBox", viewBox);
  });
});
