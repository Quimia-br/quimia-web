import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Circle } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import BasicButton from "./BasicButton";

describe("BasicButton", () => {
  it("uses its label as the accessible name and keeps the icon decorative", () => {
    render(
      <BasicButton icon={<Circle data-testid="button-icon" />}>
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
});
