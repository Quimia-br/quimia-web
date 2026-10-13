import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("merges Base UI state-dependent classes with the button styles", () => {
    render(
      <Button disabled className={(state) => state.disabled ? "consumer-disabled" : "consumer-enabled"}>
        Salvar
      </Button>,
    );

    expect(screen.getByRole("button", { name: "Salvar" })).toHaveClass("consumer-disabled", "inline-flex");
  });
});
