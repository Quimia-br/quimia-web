import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ChipFilters from "./ChipFilters";

const options = [
  { value: "red", label: "Vermelho" },
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
] as const;

describe("ChipFilters", () => {
  it("selects multiple generic values and clears them through the controlled callback", () => {
    function Example() {
      const [value, setValue] = useState<string[]>([]);
      return <><ChipFilters clearable options={options} value={value} onValueChange={setValue} />
        <output aria-label="Seleção">{value.join(",")}</output></>;
    }
    render(<Example />);
    expect(screen.getByRole("group", { name: "Filtros" })).toBeInTheDocument();
    const clear = screen.getByRole("button", { name: "Limpar filtros" });
    expect(clear).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Vermelho" }));
    fireEvent.click(screen.getByRole("button", { name: "Azul" }));
    expect(screen.getByLabelText("Seleção")).toHaveTextContent("red,blue");
    expect(screen.getByRole("button", { name: "Vermelho" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Azul" }).querySelector("svg")).not.toBeInTheDocument();
    fireEvent.click(clear);
    expect(screen.getByLabelText("Seleção")).toHaveTextContent("");
    expect(clear).toBeDisabled();
  });

  it("forwards the group label, description and native container attributes", () => {
    render(<><p id="filter-help">Escolha cores.</p><ChipFilters clearable id="colors" className="custom-class" aria-describedby="filter-help" label="Cores" clearLabel="Limpar cores" options={options} value={["blue"]} onValueChange={() => {}} /></>);
    const group = screen.getByRole("group", { name: "Cores" });
    expect(group).toHaveAttribute("aria-describedby", "filter-help");
    expect(document.getElementById("colors")).toHaveClass("custom-class");
    expect(screen.getByRole("button", { name: "Limpar cores" })).toBeEnabled();
  });

  it("respects a disabled group and individually disabled options", () => {
    const changed = vi.fn();
    const withDisabled = [{ value: "red", label: "Vermelho" }, { value: "blue", label: "Azul", disabled: true }] as const;
    const { rerender } = render(<ChipFilters clearable options={withDisabled} value={["red"]} onValueChange={changed} />);
    expect(screen.getByRole("button", { name: "Azul" })).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(screen.getByRole("button", { name: "Azul" }));
    expect(changed).not.toHaveBeenCalled();
    rerender(<ChipFilters clearable options={withDisabled} value={["red"]} onValueChange={changed} disabled />);
    expect(screen.getByRole("button", { name: "Vermelho" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Limpar filtros" })).toBeDisabled();
  });

  it("leaves readonly option and selection inputs untouched", () => {
    const immutableOptions = Object.freeze([
      Object.freeze({ value: "red", label: "Vermelho" }),
      Object.freeze({ value: "blue", label: "Azul" }),
    ]);
    const selected = Object.freeze(["red"]);
    const changed = vi.fn();
    render(<ChipFilters options={immutableOptions} value={selected} onValueChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Azul" }));
    expect(changed).toHaveBeenCalledWith(["red", "blue"], expect.anything());
    expect(selected).toEqual(["red"]);
    expect(immutableOptions).toEqual([
      { value: "red", label: "Vermelho" },
      { value: "blue", label: "Azul" },
    ]);
  });

  it("moves focus between generic options with arrow keys", async () => {
    render(<ChipFilters options={options} value={[]} onValueChange={() => {}} />);
    const first = screen.getByRole("button", { name: "Vermelho" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Azul" }));
  });

  it("omits the optional clear action by default", () => {
    render(<ChipFilters options={options} value={["red"]} onValueChange={() => {}} />);
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Vermelho" })).toHaveAttribute("aria-pressed", "true");
  });
});
