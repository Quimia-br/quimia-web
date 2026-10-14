import { createRef, useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import Chip, { ChipAction } from "./Chip";

describe("Chip", () => {
  it("toggles with click, Enter and Space without submitting a form", async () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}><Chip>Nome</Chip></form>);
    const chip = screen.getByRole("button", { name: "Nome" });
    expect(chip).toHaveAttribute("aria-pressed", "false");
    const user = userEvent.setup();
    await user.click(chip);
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(chip.querySelector("svg")).not.toBeInTheDocument();
    chip.focus();
    await user.keyboard("{Enter}");
    expect(chip).toHaveAttribute("aria-pressed", "false");
    await user.keyboard(" ");
    expect(chip).toHaveAttribute("aria-pressed", "true");
    expect(submit).not.toHaveBeenCalled();
  });

  it("respects controlled state and forwards native attributes and ref", () => {
    const ref = createRef<HTMLButtonElement>();
    const changed = vi.fn();
    render(<Chip pressed onPressedChange={changed} ref={ref} id="field-name" title="Campo nome" data-test="chip">Nome</Chip>);
    const chip = screen.getByRole("button", { name: "Nome" });
    expect(chip).toBe(ref.current);
    expect(chip).toHaveAttribute("id", "field-name");
    expect(chip).toHaveAttribute("title", "Campo nome");
    expect(chip).toHaveAttribute("data-test", "chip");
    fireEvent.click(chip);
    expect(changed).toHaveBeenCalledWith(false, expect.anything());
    expect(chip).toHaveAttribute("aria-pressed", "true");
  });

  it("shows each group's resolved pressed state and allows multiple selection", () => {
    function Fields() {
      const [value, setValue] = useState<string[]>(["name"]);
      return <ToggleGroup multiple value={value} onValueChange={setValue} aria-label="Campos">
        <Chip value="name">Nome</Chip><Chip value="type">Tipo</Chip>
      </ToggleGroup>;
    }
    render(<Fields />);
    const name = screen.getByRole("button", { name: "Nome" });
    const type = screen.getByRole("button", { name: "Tipo" });
    expect(name).toHaveAttribute("aria-pressed", "true");
    expect(name.querySelector("svg")).not.toBeInTheDocument();
    expect(type.querySelector("svg")).not.toBeInTheDocument();
    fireEvent.click(type);
    expect(name).toHaveAttribute("aria-pressed", "true");
    expect(type).toHaveAttribute("aria-pressed", "true");
    expect(type.querySelector("svg")).not.toBeInTheDocument();
  });

  it("blocks disabled toggle and keeps clear as an ordinary button", () => {
    const onClick = vi.fn();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={onSubmit}><Chip disabled defaultPressed>Nome</Chip><ChipAction onClick={onClick}>Limpar filtros</ChipAction></form>);
    expect(screen.getByRole("button", { name: "Nome" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Limpar filtros" })).not.toHaveAttribute("aria-pressed");
  });
});
