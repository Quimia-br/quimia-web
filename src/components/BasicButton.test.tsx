import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Circle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import BasicButton from "./BasicButton";

describe("BasicButton", () => {
  it("uses its label as the accessible name and keeps the icon decorative", () => {
    render(
      <BasicButton icon={<svg role="img" data-testid="button-icon"><title>Circle</title></svg>}>
        Continue
      </BasicButton>,
    );

    const button = screen.getByRole("button", { name: "Continue" });
    const icon = screen.getByTestId("button-icon");

    expect(button).toHaveAccessibleName("Continue");
    expect(icon.closest("[aria-hidden='true']")).toBeInTheDocument();
  });

  it("handles clicks and blocks interaction when disabled", async () => {
    const user = userEvent.setup();
    const enabledClick = vi.fn();
    const disabledClick = vi.fn();

    render(
      <>
        <BasicButton onClick={enabledClick}>Enabled</BasicButton>
        <BasicButton disabled onClick={disabledClick}>
          Disabled
        </BasicButton>
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Enabled" }));
    await user.click(screen.getByRole("button", { name: "Disabled" }));

    expect(enabledClick).toHaveBeenCalledOnce();
    expect(disabledClick).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Disabled" })).toBeDisabled();
  });

  it("defaults to type button so it does not submit a surrounding form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <BasicButton>Open</BasicButton>
      </form>,
    );

    const button = screen.getByRole("button", { name: "Open" });

    expect(button).toHaveAttribute("type", "button");
    await user.click(button);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([
    ["primary", "bg-primary-primary", "hover:bg-primary-hover", "active:bg-primary-pressed"],
    ["secondary", "bg-secondary-primary", "hover:bg-secondary-hover", "active:bg-secondary-secondary"],
  ] as const)(
    "connects the %s variant to its design-state tokens",
    (variant, defaultClass, hoverClass, pressedClass) => {
      render(<BasicButton variant={variant}>Label</BasicButton>);

      expect(screen.getByRole("button", { name: "Label" })).toHaveClass(
        defaultClass,
        hoverClass,
        pressedClass,
      );
    },
  );

  it("supports the critical action from the design without exposing its icon name", () => {
    render(<BasicButton variant="critical" icon={<Circle />}>Excluir</BasicButton>);

    expect(screen.getByRole("button", { name: "Excluir" })).toHaveClass(
      "bg-feedback-error", "text-foreground-error",
    );
  });

  it("can be activated by Enter and Space without submitting its form", async () => {
    const user = userEvent.setup();
    const clicked = vi.fn();
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submitted}><BasicButton onClick={clicked}>Continuar</BasicButton></form>);
    await user.tab();
    expect(screen.getByRole("button", { name: "Continuar" })).toHaveFocus();
    await user.keyboard("{Enter} ");
    expect(clicked).toHaveBeenCalledTimes(2);
    expect(submitted).not.toHaveBeenCalled();
  });

  it("submits only when the caller explicitly uses type submit", async () => {
    const user = userEvent.setup();
    const submitted = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submitted}><BasicButton type="submit">Salvar</BasicButton></form>);
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(submitted).toHaveBeenCalledOnce();
  });

  it("forwards a ref so a form can move focus to its primary action", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<BasicButton ref={ref}>Salvar</BasicButton>);
    ref.current?.focus();
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveFocus();
  });
});
