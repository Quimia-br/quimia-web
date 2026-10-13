import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SignupForm from "@/components/SignupForm";
import { register } from "@/services/auth";

vi.mock("@/services/auth", () => ({ register: vi.fn() }));

function renderSignupForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<p>Tela de login</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

async function fillValidSignup(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nome"), "Omo");
  await user.type(screen.getByLabelText("CNPJ"), "11222333000181");
  await user.type(screen.getByLabelText("E-mail"), "omo@example.com");
  await user.type(screen.getByLabelText("Senha"), "senhaOmo123");
}

describe("SignupForm", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(register).mockReset();
  });

  it("enables submit only after every input has a value", async () => {
    const user = userEvent.setup();

    renderSignupForm();

    const submitButton = screen.getByRole("button", { name: "Cadastrar" });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("CNPJ"), "1");
    await user.type(screen.getByLabelText("Nome"), "Omo");
    await user.type(screen.getByLabelText("E-mail"), "user@example.com");
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText("Senha"), "secret");
    expect(submitButton).toBeEnabled();
  });

  it("keeps untouched field errors visible and clears only the edited field", async () => {
    const user = userEvent.setup();

    renderSignupForm();

    await user.type(screen.getByLabelText("CNPJ"), "1");
    await user.type(screen.getByLabelText("Nome"), "Omo");
    await user.type(screen.getByLabelText("E-mail"), "invalid");
    await user.type(screen.getByLabelText("Senha"), "secret");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("CNPJ inválido")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail valido")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();

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

  it("returns to login and clears the draft after registration", async () => {
    vi.mocked(register).mockResolvedValue({ id: 1, nome: "Omo", email: "omo@example.com" });
    const user = userEvent.setup();
    renderSignupForm();
    await fillValidSignup(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
    expect(localStorage.getItem("quimia:signup-draft")).toBeNull();
    expect(register).toHaveBeenCalledWith({ nome: "Omo", cnpj: "11.222.333/0001-81", email: "omo@example.com", senha: "senhaOmo123" }, expect.anything());
  });

  it.each([
    ["email_in_use", "Este e-mail já está em uso."],
    ["cnpj_in_use", "Este CNPJ já está cadastrado."],
    ["invalid_cnpj", "O CNPJ informado é inválido."],
    ["weak_password", "Use uma senha com pelo menos 8 caracteres, uma letra e um número."],
    ["password_too_long", "A senha deve ter no máximo 72 bytes."],
  ])("shows the API problem detail %s without leaving signup", async (detail, message) => {
    vi.mocked(register).mockRejectedValue(new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 422, statusText: "Unprocessable Content", data: { detail }, headers: new AxiosHeaders(), config: { headers: new AxiosHeaders() },
    }));
    const user = userEvent.setup();
    renderSignupForm();
    await fillValidSignup(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(await screen.findByText(message)).toHaveAttribute("role", "alert");
    expect(screen.queryByText("Tela de login")).not.toBeInTheDocument();
  });

  it("marks its password as a new credential for password managers", () => {
    renderSignupForm();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("autocomplete", "new-password");
  });

  it("restores company data and saves the draft without its password", async () => {
    localStorage.setItem("quimia:signup-draft", JSON.stringify({ nome: "Acme", cnpj: "11.222.333/0001-81", email: "acme@example.com" }));
    const user = userEvent.setup();
    renderSignupForm();
    expect(screen.getByLabelText("Nome")).toHaveValue("Acme");
    expect(screen.getByLabelText("CNPJ")).toHaveValue("11.222.333/0001-81");
    expect(screen.getByLabelText("E-mail")).toHaveValue("acme@example.com");
    expect(screen.getByLabelText("Senha")).toHaveValue("");
    await user.type(screen.getByLabelText("Senha"), "private-password123");
    expect(JSON.parse(localStorage.getItem("quimia:signup-draft")!)).toEqual({ nome: "Acme", cnpj: "11.222.333/0001-81", email: "acme@example.com" });
  });

  it("shows a generic failure for unexpected API errors and preserves the draft", async () => {
    vi.mocked(register).mockRejectedValue(new Error("Network failed"));
    const user = userEvent.setup();
    renderSignupForm();
    await fillValidSignup(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível cadastrar. Tente novamente.");
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeEnabled();
    expect(screen.getByLabelText("Nome")).toHaveValue("Omo");
    expect(localStorage.getItem("quimia:signup-draft")).not.toBeNull();
  });

  it("blocks duplicate registration until the pending request finishes", async () => {
    let resolveRegister!: (value: Awaited<ReturnType<typeof register>>) => void;
    vi.mocked(register).mockImplementation(() => new Promise((resolve) => { resolveRegister = resolve; }));
    const user = userEvent.setup();
    renderSignupForm();
    await fillValidSignup(user);
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));
    const pendingButton = await screen.findByRole("button", { name: "Cadastrando..." });
    expect(pendingButton).toBeDisabled();
    await user.click(pendingButton);
    expect(register).toHaveBeenCalledOnce();
    await act(async () => resolveRegister({ id: 1, nome: "Omo", email: "omo@example.com" }));
    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
  });

  it("opens login using the existing-account link", async () => {
    const user = userEvent.setup();
    renderSignupForm();
    await user.click(screen.getByRole("link", { name: "Entre aqui" }));
    expect(await screen.findByText("Tela de login")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });
});
