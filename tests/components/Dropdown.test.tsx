import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vite-plus/test";
import Dropdown from "@/components/Dropdown";
import FormDropdown from "@/components/FormDropdown";
import Form from "@/components/smoothui/form";

const options = [
  { value: "liquido", label: "Líquido" },
  { value: "po", label: "Em pó" },
  { value: "gel", label: "Gel", disabled: true },
];

describe("Dropdown", () => {
  it("shows the placeholder for empty string form defaults", () => {
    render(<Dropdown label="Tipo" value="" options={options} />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Selecione");
  });

  it("preserves custom ids and external help through the form adapter", () => {
    render(
      <>
        <p id="external">Ajuda externa</p>
        <Form errors={{ tipo: "Selecione um tipo" }}>
          <FormDropdown
            id="custom-tipo"
            name="tipo"
            label="Tipo"
            aria-describedby="external"
            options={options}
          />
        </Form>
      </>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tipo" });
    expect(trigger).toHaveAttribute("id", "custom-tipo");
    expect(trigger).toHaveAccessibleDescription("Ajuda externa Selecione um tipo");
  });
  it("labels the control and announces its placeholder and help", () => {
    render(
      <Dropdown
        label="Tipo"
        name="tipo"
        placeholder="Selecione"
        description="Escolha um tipo"
        options={options}
      />,
    );
    const trigger = screen.getByRole("combobox", { name: "Tipo" });
    expect(trigger).toHaveTextContent("Selecione");
    expect(trigger).toHaveAccessibleDescription("Escolha um tipo");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("selects a label, closes the list and submits the underlying value", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Dropdown label="Tipo" name="tipo" options={options} />
      </form>,
    );
    await user.click(screen.getByRole("combobox", { name: "Tipo" }));
    await user.click(await screen.findByRole("option", { name: "Em pó" }));
    expect(screen.getByRole("combobox", { name: "Tipo" })).toHaveTextContent("Em pó");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(new FormData(container.querySelector("form")!).get("tipo")).toBe("po");
  });

  it("supports controlled values and updates from the parent", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState<string | null>("liquido");
      return (
        <>
          <Dropdown label="Tipo" options={options} value={value} onValueChange={setValue} />
          <button onClick={() => setValue(null)}>Limpar</button>
        </>
      );
    }
    render(<Controlled />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Líquido");
    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByRole("option", { name: "Em pó" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Em pó");
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(screen.getByRole("combobox")).toHaveTextContent("Selecione");
  });

  it("supports keyboard selection and Escape without selecting disabled options", async () => {
    const user = userEvent.setup();
    render(<Dropdown label="Tipo" options={options} defaultValue="liquido" />);
    screen.getByRole("combobox").focus();
    await user.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await user.keyboard("{End}{Enter}");
    expect(screen.getByRole("combobox")).toHaveTextContent("Líquido");
    await user.keyboard("{ArrowUp}{Enter}");
    expect(screen.getByRole("combobox")).toHaveTextContent("Em pó");
    await user.click(screen.getByRole("combobox"));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("prevents interaction and omits disabled fields from form submission", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Dropdown label="Tipo" name="tipo" options={options} defaultValue="po" disabled />
      </form>,
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    await user.click(screen.getByRole("combobox"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(new FormData(container.querySelector("form")!).has("tipo")).toBe(false);
  });

  it("associates errors with the control and preserves external help", () => {
    render(
      <>
        <p id="external">Campo obrigatório</p>
        <Dropdown
          label="Tipo"
          description="Ajuda"
          error="Selecione um tipo"
          aria-describedby="external"
          options={options}
        />
      </>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("combobox")).toHaveAccessibleDescription(
      "Campo obrigatório Selecione um tipo",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Selecione um tipo");
    expect(screen.queryByText("Ajuda")).not.toBeInTheDocument();
  });

  it("integrates with the form validation context without dangling descriptions", async () => {
    const user = userEvent.setup();
    render(
      <Form errors={{ tipo: "Selecione um tipo" }}>
        <FormDropdown name="tipo" label="Tipo" options={options} />
      </Form>,
    );
    const trigger = screen.getByRole("combobox", { name: "Tipo" });
    expect(trigger).toHaveAccessibleDescription("Selecione um tipo");
    for (const id of trigger.getAttribute("aria-describedby")!.split(" "))
      expect(document.getElementById(id)).not.toBeNull();
    await user.click(trigger);
    await user.click(await screen.findByRole("option", { name: "Líquido" }));
    expect(trigger).toHaveTextContent("Líquido");
  });
});
