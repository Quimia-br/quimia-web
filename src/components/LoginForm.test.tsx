import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";
import { login } from "@/services/auth";
import { authKeys } from "@/hooks/use-user";

vi.mock("@/services/auth", () => ({
  login: vi.fn(),
}));

function renderLoginForm(
  initialEntry: Parameters<typeof MemoryRouter>[0]["initialEntries"] = ["/login"],
) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });

  function ProtectedPage() {
    const location = useLocation();
    return <><p>Protected page</p><output aria-label="Destination">{location.pathname}{location.search}{location.hash}</output></>;
  }

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntry}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/protected" element={<ProtectedPage />} />
          <Route path="/" element={<p>Home page</p>} />
          <Route path="/signup" element={<p>Signup page</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
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
    expect(login).not.toHaveBeenCalled();

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
      id: 1,
      nome: "Usuário de Teste",
      email: "qa@example.com",
    });
    const user = userEvent.setup();

    const { queryClient } = renderLoginForm([
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
    expect(screen.getByLabelText("Destination")).toHaveTextContent("/protected?tab=profile#details");
    expect(queryClient.getQueryData(authKeys.user())).toEqual({ id: 1, nome: "Usuário de Teste", email: "qa@example.com" });
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

  it("restores and saves only the email draft", async () => {
    localStorage.setItem("quimia:login-draft", JSON.stringify({ email: "saved@example.com" }));
    const user = userEvent.setup();
    renderLoginForm();
    expect(screen.getByLabelText("E-mail")).toHaveValue("saved@example.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "new@example.com");
    await user.type(screen.getByLabelText("Senha"), "private-password");
    expect(JSON.parse(localStorage.getItem("quimia:login-draft")!)).toEqual({ email: "new@example.com" });
  });

  it("blocks duplicate submission while login is pending and goes home without a destination", async () => {
    let resolveLogin!: (value: Awaited<ReturnType<typeof login>>) => void;
    vi.mocked(login).mockImplementation(() => new Promise((resolve) => { resolveLogin = resolve; }));
    const user = userEvent.setup();
    renderLoginForm();
    await user.type(screen.getByLabelText("E-mail"), "qa@example.com");
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    const pendingButton = await screen.findByRole("button", { name: "Entrando..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(login).toHaveBeenCalledOnce();
    await act(async () => resolveLogin({ id: 1, nome: "QA", email: "qa@example.com" }));
    expect(await screen.findByText("Home page")).toBeInTheDocument();
  });

  it("opens signup using the registration link", async () => {
    const user = userEvent.setup();
    renderLoginForm();
    await user.click(screen.getByRole("link", { name: "Crie já" }));
    expect(await screen.findByText("Signup page")).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });
});
