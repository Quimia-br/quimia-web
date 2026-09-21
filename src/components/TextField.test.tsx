import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import TextField from "./TextField";

describe("TextField", () => {
  it("associates its label and description with the input", () => {
    render(
      <TextField
        id="email"
        label="Email"
        description="Use your work email"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });

    expect(input).toHaveAccessibleDescription("Use your work email");
    expect(input).toHaveAttribute("aria-describedby", "email-description");
  });

  it("announces an error instead of the description without recoloring the label", () => {
    render(
      <TextField
        id="email"
        label="Email"
        description="Use your work email"
        error="Email is required"
      />,
    );

    const input = screen.getByRole("textbox", { name: "Email" });
    const label = screen.getByText("Email");

    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Email is required");
    expect(screen.queryByText("Use your work email")).not.toBeInTheDocument();
    expect(label).toHaveClass("text-foreground");
    expect(label).not.toHaveClass("text-destructive");
  });

  it("preserves an external aria-describedby reference", () => {
    render(
      <>
        <p id="format-help">Format: name@example.com</p>
        <TextField
          id="email"
          label="Email"
          description="Use your work email"
          aria-describedby="format-help"
        />
      </>,
    );

    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-describedby",
      "format-help email-description",
    );
  });

  it("integrates the clearable input with controlled state", async () => {
    const user = userEvent.setup();

    function ControlledTextField() {
      const [value, setValue] = useState("React");

      return (
        <TextField
          label="Search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onClear={() => setValue("")}
        />
      );
    }

    render(<ControlledTextField />);

    const input = screen.getByRole("textbox", { name: "Search" });
    await user.click(screen.getByRole("button", { name: "Clear input" }));

    expect(input).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Clear input" })).not.toBeInTheDocument();
  });
});
