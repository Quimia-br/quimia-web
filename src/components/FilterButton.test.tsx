import type { FormEvent } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilterButton from "./FilterButton";

describe("FilterButton", () => {
  it("provides a default accessible name and accepts a custom title", () => {
    const { rerender } = render(<FilterButton />);
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveAttribute("title", "Filtros");
    rerender(<FilterButton title="Filtros de pedidos" />);
    expect(screen.getByRole("button", { name: "Filtros de pedidos" })).toHaveAttribute("title", "Filtros de pedidos");
  });

  it("handles click without submitting its surrounding form", async () => {
    const clicked = vi.fn();
    const submitted = vi.fn((event: FormEvent) => event.preventDefault());
    render(<form onSubmit={submitted}><FilterButton onClick={clicked} /></form>);
    const button = screen.getByRole("button", { name: "Filtros" });
    await userEvent.click(button);
    expect(button).toHaveAttribute("type", "button");
    expect(clicked).toHaveBeenCalledOnce();
    expect(submitted).not.toHaveBeenCalled();
  });

  it("is reachable by keyboard and activates with Enter and Space", async () => {
    const clicked = vi.fn();
    const user = userEvent.setup();
    render(<FilterButton onClick={clicked} />);
    await user.tab();
    expect(screen.getByRole("button", { name: "Filtros" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(clicked).toHaveBeenCalledTimes(2);
  });

  it("blocks activation and skips keyboard focus when disabled", async () => {
    const clicked = vi.fn();
    const user = userEvent.setup();
    render(<FilterButton disabled onClick={clicked} />);
    const button = screen.getByRole("button", { name: "Filtros" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    await user.click(button);
    await user.tab();
    expect(button).not.toHaveFocus();
    expect(clicked).not.toHaveBeenCalled();
  });

  it("forwards controlled disclosure attributes without changing them on its own", () => {
    const clicked = vi.fn();
    const { rerender } = render(<FilterButton aria-expanded={false} aria-controls="filters-panel" onClick={clicked} />);
    const button = screen.getByRole("button", { name: "Filtros" });
    expect(button).toHaveAttribute("aria-controls", "filters-panel");
    fireEvent.click(button);
    expect(clicked).toHaveBeenCalledOnce();
    expect(button).toHaveAttribute("aria-expanded", "false");
    rerender(<FilterButton aria-expanded aria-controls="filters-panel" onClick={clicked} />);
    expect(button).toHaveAttribute("aria-expanded", "true");
    rerender(<FilterButton />);
    expect(button).not.toHaveAttribute("aria-expanded");
    expect(button).not.toHaveAttribute("aria-controls");
  });
});
