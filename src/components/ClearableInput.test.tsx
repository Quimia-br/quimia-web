import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ClearableInput from "./ClearableInput";

describe("ClearableInput", () => {
  it("clears an uncontrolled value, calls onClear, and restores focus", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();

    render(<ClearableInput aria-label="Search" onClear={onClear} />);

    const input = screen.getByRole("textbox", { name: "Search" });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    await user.type(input, "React");
    const clearButton = screen.getByRole("button", { name: "Clear input" });
    await user.click(clearButton);

    expect(input).toHaveValue("");
    expect(onClear).toHaveBeenCalledOnce();
    expect(input).toHaveFocus();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it.each([
    ["disabled", { disabled: true }],
    ["read-only", { readOnly: true }],
  ] as const)("does not offer clearing when the input is %s", (_, state) => {
    render(
      <ClearableInput
        aria-label="Search"
        defaultValue="React"
        {...state}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("supports a custom clear label and forwards its ref", () => {
    const ref = createRef<HTMLInputElement>();

    render(
      <ClearableInput
        ref={ref}
        aria-label="Search"
        clearLabel="Remove search"
        defaultValue="React"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search" });

    expect(screen.getByRole("button", { name: "Remove search" })).toBeInTheDocument();
    expect(ref.current).toBe(input);
  });
});
