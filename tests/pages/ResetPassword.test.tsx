import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ResetPassword from "@/pages/ResetPassword";
import { api } from "@/services/api";

const originalAdapter = api.defaults.adapter;
let requests: { url?: string; data: Record<string, string> }[];

function setup(path = "/recuperar-senha") {
  function Destination() {
    const location = useLocation();
    return (
      <p>
        {location.pathname}
        {location.search}
      </p>
    );
  }
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/recuperar-senha" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/success" element={<Destination />} />
        <Route path="/login" element={<p>Tela de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

function reject(detail: string, status = 400) {
  api.defaults.adapter = async (config) => {
    throw new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, {
      config,
      status,
      statusText: "Error",
      headers: new AxiosHeaders(),
      data: { detail },
    });
  };
}

async function fillPasswords(
  user: ReturnType<typeof userEvent.setup>,
  confirmation = "Empresa456",
) {
  await user.type(screen.getByLabelText("Criar senha"), "Empresa456");
  await user.type(screen.getByLabelText("Confirmar sua senha"), confirmation);
}

beforeEach(() => {
  localStorage.clear();
  requests = [];
  api.defaults.adapter = async (config) => {
    requests.push({ url: config.url, data: JSON.parse(config.data) });
    return { config, status: 202, statusText: "Accepted", headers: new AxiosHeaders(), data: "" };
  };
});
afterEach(() => {
  api.defaults.adapter = originalAdapter;
  vi.useRealTimers();
});

describe("company password recovery", () => {
  it("validates the email before sending and shows a private confirmation", async () => {
    const user = userEvent.setup();
    setup();
    expect(screen.getByRole("button", { name: "Enviar e-mail" })).toBeDisabled();
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("maxlength", "255");
    await user.type(screen.getByLabelText("E-mail"), "invalid");
    await user.click(screen.getByRole("button", { name: "Enviar e-mail" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um e-mail válido");
    expect(requests).toHaveLength(0);
    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "empresa@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar e-mail" }));
    expect(
      await screen.findByRole("heading", { name: "Verifique seu e-mail" }),
    ).toBeInTheDocument();
    expect(requests).toEqual([
      { url: "/empresas/auth/forgot-password", data: { email: "empresa@example.com" } },
    ]);
    expect(screen.getByRole("button", { name: /Reenviar/ })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Abrir meu e-mail padrão" })).toHaveAttribute(
      "href",
      "mailto:",
    );
  });

  it("waits for the API cooldown and resends to the same email", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("E-mail"), "empresa@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar e-mail" }));
    await screen.findByRole("heading", { name: "Verifique seu e-mail" });
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(screen.getByRole("button", { name: "Reenviar" })).toBeEnabled();
    vi.useRealTimers();
    await user.click(screen.getByRole("button", { name: "Reenviar" }));
    expect(requests).toHaveLength(2);
    expect(requests[1]?.data).toEqual({ email: "empresa@example.com" });
    expect(screen.getByRole("button", { name: /Reenviar/ })).toBeDisabled();
  });

  it("shows send failure feedback and returns to the entered email", async () => {
    reject("unavailable", 503);
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByLabelText("E-mail"), "empresa@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar e-mail" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível enviar o e-mail");
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("empresa@example.com");
  });

  it.each(["/reset-password?token=link-token", "/recuperar-senha?token=link-token"])(
    "uses the emailed token and removes it on success at %s",
    async (path) => {
      const user = userEvent.setup();
      setup(path);
      await fillPasswords(user);
      await user.click(screen.getByRole("button", { name: "Resetar senha" }));
      expect(await screen.findByText("/reset-password/success")).toBeInTheDocument();
      expect(requests).toEqual([
        {
          url: "/empresas/auth/reset-password",
          data: { resetToken: "link-token", novaSenha: "Empresa456" },
        },
      ]);
      expect(localStorage.length).toBe(0);
    },
  );

  it("rejects mismatched passwords before contacting the API", async () => {
    const user = userEvent.setup();
    setup("/reset-password?token=link-token");
    expect(screen.getByLabelText("Criar senha")).toHaveAttribute("maxlength", "72");
    expect(screen.getByLabelText("Confirmar sua senha")).toHaveAttribute("maxlength", "72");
    await fillPasswords(user, "Different456");
    await user.click(screen.getByRole("button", { name: "Resetar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("As senhas não coincidem");
    expect(requests).toHaveLength(0);
  });

  it("rejects passwords that exceed the UTF-8 byte limit", async () => {
    const user = userEvent.setup();
    setup("/reset-password?token=link-token");
    const password = "é".repeat(36) + "1";
    await user.type(screen.getByLabelText("Criar senha"), password);
    await user.type(screen.getByLabelText("Confirmar sua senha"), password);
    await user.click(screen.getByRole("button", { name: "Resetar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("72 bytes");
    expect(requests).toHaveLength(0);
  });

  it("handles expired or reused links with a new-link action", async () => {
    reject("invalid_reset_token");
    const user = userEvent.setup();
    setup("/recuperar-senha?token=expired");
    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: "Resetar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("inválido ou expirou");
    await user.click(screen.getByRole("link", { name: "Solicitar novo link" }));
    expect(screen.getByLabelText("E-mail")).toHaveValue("");
  });

  it("keeps API password-policy errors on the new-password field", async () => {
    reject("weak_password", 422);
    const user = userEvent.setup();
    setup("/reset-password?token=link-token");
    await fillPasswords(user);
    await user.click(screen.getByRole("button", { name: "Resetar senha" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escolha uma senha menos comum");
    expect(screen.getByLabelText("Criar senha")).toHaveAttribute("aria-invalid", "true");
  });

  it("treats an empty token as an invalid link", () => {
    setup("/recuperar-senha?token=");
    expect(screen.getByRole("alert")).toHaveTextContent("inválido ou expirou");
    expect(screen.getByRole("link", { name: "Solicitar novo link" })).toHaveAttribute(
      "href",
      "/reset-password",
    );
  });
});
