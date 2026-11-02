import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import ProtectedRoute from "@/lib/ProtectedRoute";

const company = { id: 1, nome: "Quimia", email: "quimia@example.com" };
const profile = { ...company, cnpj: "11222333000181", fotoUrl: null, ativo: true };
const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown = {}) {
  const response = {
    config,
    status,
    data,
    headers: new AxiosHeaders(),
    statusText: String(status),
  };
  return status >= 400
    ? Promise.reject(
        new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, response),
      )
    : Promise.resolve(response);
}

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<p>Área protegida</p>} />
          </Route>
          <Route path="/login" element={<p>Página de login</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => useAuthStore.getState().actions.login("valid", company));
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  useAuthStore.getState().actions.logout();
});

describe("ProtectedRoute", () => {
  it.each([503, "network"] as const)(
    "keeps the route and session after %s and allows another attempt",
    async (failure) => {
      let unavailable = true;
      api.defaults.adapter = (config) => {
        if (!unavailable) return respond(config, 200, profile);
        return failure === "network"
          ? Promise.reject(new AxiosError("Network Error", "ERR_NETWORK", config))
          : respond(config, failure);
      };
      setup();

      expect(screen.queryByText("Página de login")).not.toBeInTheDocument();
      expect(useAuthStore.getState().isAuthenticated).toBe(true);

      unavailable = false;
      await userEvent.setup().click(screen.getByRole("button", { name: "Tentar novamente" }));
      expect(await screen.findByText("Área protegida")).toBeInTheDocument();
    },
  );

  it("shows access denied without treating HTTP 403 as an expired session", async () => {
    api.defaults.adapter = (config) => respond(config, 403);
    setup();

    expect(await screen.findByRole("alert")).toHaveTextContent("Acesso não permitido");
    expect(screen.queryByText("Página de login")).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("allows signing out when the profile cannot be loaded", async () => {
    api.defaults.adapter = (config) =>
      config.url?.endsWith("/logout") ? respond(config, 204) : respond(config, 503);
    setup();
    expect(await screen.findByRole("alert")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Sair" }));
    expect(await screen.findByText("Página de login")).toBeVisible();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("redirects to login when the refresh is rejected with HTTP 401", async () => {
    api.defaults.adapter = (config) => respond(config, 401);
    setup();

    expect(await screen.findByText("Página de login")).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
