import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";
import { login } from "@/services/auth";

vi.mock("@/services/auth", () => ({
  login: vi.fn(),
}));

function renderLoginForm(
  initialEntry: Parameters<typeof MemoryRouter>[0]["initialEntries"] = ["/login"],
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntry}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/protected" element={<p>Protected page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(login).mockReset();
  });

  it("enables submit only after every input has a value", async () => {
    const user = userEvent.setup();

    renderLoginForm();

    const submitButton = screen.getByRole("button", { name: "Entrar" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Senha"), "secret");
    expect(submitButton).toBeEnabled();
  });

  it("keeps untouched field errors visible and clears only the edited field", async () => {
    const user = userEvent.setup();

    renderLoginForm();

    await user.type(screen.getByLabelText("E-mail"), "invalid");
    await user.type(screen.getByLabelText("Senha"), "secret");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(screen.getByText("Informe um e-mail valido")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(screen.getByText("Informe um e-mail valido")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "user@example.com");

    await waitFor(() => {
      expect(
        screen.queryByText("Informe um e-mail valido"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("E-mail")).toHaveFocus();
    expect(screen.queryByText("Looks good")).not.toBeInTheDocument();
  });

  it("sends senha and returns to the protected destination", async () => {
    vi.mocked(login).mockResolvedValue({
      id: "8e56ef8a-b307-46d6-a643-df122287a77b",
      nome: "Usuário de Teste",
      email: "qa@example.com",
    });
    const user = userEvent.setup();

    renderLoginForm([
      {
        pathname: "/login",
        state: {
          from: {
            pathname: "/protected",
            search: "?tab=profile",
            hash: "#details",
          },
        },
      },
    ]);

    await user.type(screen.getByLabelText("E-mail"), "qa@example.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte-2026!");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: "qa@example.com",
        senha: "SenhaForte-2026!",
      }, expect.anything());
    });
    expect(await screen.findByText("Protected page")).toBeInTheDocument();
  });

  it("shows an error and stays on login when authentication fails", async () => {
    vi.mocked(login).mockRejectedValue(new Error("Unauthorized"));
    const user = userEvent.setup();

    renderLoginForm();

    await user.type(screen.getByLabelText("E-mail"), "qa@example.com");
    await user.type(screen.getByLabelText("Senha"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const error = await screen.findByText(
      "Não foi possível entrar. Verifique seu e-mail e senha.",
    );
    expect(error).toHaveAttribute("role", "alert");
    expect(screen.queryByText("Protected page")).not.toBeInTheDocument();
  });
});
