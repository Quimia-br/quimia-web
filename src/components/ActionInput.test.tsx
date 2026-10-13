import { createRef, useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActionInput from "./ActionInput";

const ClearableInput = ActionInput;

describe("ActionInput", () => {
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

  it("notifies onChange with the empty value when clearing an uncontrolled input", async () => {
    const user = userEvent.setup();
    const changes: string[] = [];
    render(<ActionInput aria-label="Search" defaultValue="React" onChange={(event) => changes.push(event.target.value)} />);

    await user.click(screen.getByRole("button", { name: "Clear input" }));

    expect(changes).toEqual([""]);
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveValue("");
  });

  it("clears controlled state through onChange without requiring onClear", async () => {
    const user = userEvent.setup();
    function ControlledInput() {
      const [value, setValue] = useState("React");
      return <><ActionInput aria-label="Search" value={value} onChange={(event) => setValue(event.target.value)} /><output aria-label="Current value">{value || "Empty"}</output></>;
    }
    render(<ControlledInput />);
    await user.click(screen.getByRole("button", { name: "Clear input" }));
    expect(screen.getByLabelText("Current value")).toHaveTextContent("Empty");
    expect(screen.getByRole("textbox", { name: "Search" })).toHaveFocus();
  });

  it("uses the legacy clickLabel and callback only for the clear action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const onClear = vi.fn();
    render(<ActionInput aria-label="Search" defaultValue="React" clickLabel="Reset search" onClick={onClick} onClear={onClear} />);
    await user.click(screen.getByRole("textbox", { name: "Search" }));
    expect(onClick).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reset search" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("reveals and hides a password without submitting its form and restores its caret", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={onSubmit}><ActionInput type="password" aria-label="Password" defaultValue="secret" /></form>);
    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    await waitFor(() => expect(input).toHaveFocus());
    expect((input as HTMLInputElement).selectionStart).toBe(6);
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("secret");
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it.each([{ disabled: true }, { readOnly: true }])("does not expose password actions for %o", (state) => {
    render(<ActionInput type="password" aria-label="Password" defaultValue="secret" {...state} />);
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
