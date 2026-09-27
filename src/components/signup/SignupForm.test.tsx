import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import SignupForm from "./SignupForm";

describe("SignupForm", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("enables submit only after every input has a value", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>,
    );

    const submitButton = screen.getByRole("button", { name: "Cadastrar" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("CNPJ"), "1");
    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Senha"), "secret");
    expect(submitButton).toBeEnabled();
  });

  it("keeps untouched field errors visible and clears only the edited field", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <SignupForm />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText("CNPJ"), "1");
    await user.type(screen.getByLabelText("E-mail"), "invalid");
    await user.type(screen.getByLabelText("Senha"), "secret");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail valido")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));
    expect(screen.getByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail valido")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "user@example.com");

    expect(screen.getByText("CNPJ inválido")).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByText("Informe um e-mail valido"),
      ).not.toBeInTheDocument();
    });
    expect(screen.queryByText("Looks good")).not.toBeInTheDocument();
  });
});
