import axios, { AxiosError, AxiosHeaders } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "./api";
import { useAuthStore } from "./auth-token";
import { login } from "@/services/auth";
import { getMe } from "@/services/empresas";

const empresa = { id: 1, nome: "Omo", email: "omo@example.com" };
const profile = { ...empresa, cnpj: "11222333000181", fotoUrl: null, ativo: true };
const session = {
  accessToken: "new-access-token",
  tokenType: "Bearer",
  expiresIn: 900,
  empresa,
};
const originalApiAdapter = api.defaults.adapter;
const originalAxiosAdapter = axios.defaults.adapter;

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = { config, status, data, statusText: String(status), headers: new AxiosHeaders() };
  if (status >= 400) {
    return Promise.reject(new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response));
  }
  return Promise.resolve(response);
}

function server(adapter: AxiosAdapter) {
  // Keep the client, interceptors and store real; replace only the network boundary.
  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
}

describe("EmpresaAuth integration", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().actions.logout();
  });

  afterEach(() => {
    api.defaults.adapter = originalApiAdapter;
    axios.defaults.adapter = originalAxiosAdapter;
    vi.restoreAllMocks();
  });

  it("uses empresa from the login response to establish the session", async () => {
    server((config) => respond(config, 200, session));

    expect(await login({ email: empresa.email, senha: "senhaOmo123" })).toEqual(empresa);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "new-access-token", user: empresa, isAuthenticated: true,
    });
    expect(localStorage.getItem("quimia:auth-storage")).not.toContain("new-access-token");
  });

  it("restores the session after a reload using a bodyless cookie refresh", async () => {
    useAuthStore.setState({ user: empresa, isAuthenticated: true, accessToken: null });
    server((config) => {
      if (config.url?.endsWith("/empresas/auth/refresh")) {
        // EmpresaAuthController rejects even an empty JSON object.
        return respond(config, config.data == null ? 200 : 400, session);
      }
      return respond(config, config.headers.Authorization === "Bearer new-access-token" ? 200 : 401, profile);
    });

    expect(await getMe()).toEqual(profile);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: "new-access-token", user: empresa, isAuthenticated: true });
  });

  it("shares one refresh across simultaneous expired-token requests", async () => {
    useAuthStore.getState().actions.login("expired", empresa);
    let refreshCount = 0;
    server(async (config) => {
      if (config.url?.endsWith("/empresas/auth/refresh")) {
        refreshCount++;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return respond(config, 200, session);
      }
      return respond(config, config.headers.Authorization === "Bearer new-access-token" ? 200 : 401, profile);
    });

    expect(await Promise.all([getMe(), getMe(), getMe()])).toEqual([profile, profile, profile]);
    expect(refreshCount).toBe(1);
  });

  it.each(["login", "register", "forgot-password", "reset-password", "refresh", "logout"])(
    "does not renew or mask a 401 from the %s endpoint", async (endpoint) => {
      let refreshCount = 0;
      server((config) => {
        if (config.url?.endsWith("/refresh")) refreshCount++;
        return respond(config, 401, { detail: "original_error" });
      });

      await expect(api.post(`/empresas/auth/${endpoint}`)).rejects.toMatchObject({
        response: { status: 401, data: { detail: "original_error" } },
      });
      expect(refreshCount).toBe(endpoint === "refresh" ? 1 : 0);
    },
  );

  it("clears the session when the cookie refresh is rejected", async () => {
    useAuthStore.getState().actions.login("expired", empresa);
    let refreshCount = 0;
    server((config) => {
      if (config.url?.endsWith("/refresh")) refreshCount++;
      return respond(config, 401, { detail: "invalid_refresh" });
    });

    await expect(getMe()).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshCount).toBe(1);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, user: null, isAuthenticated: false });
  });

  it("stops retrying and clears the session if the renewed token is also rejected", async () => {
    useAuthStore.getState().actions.login("expired", empresa);
    let refreshCount = 0;
    server((config) => {
      if (config.url?.endsWith("/refresh")) {
        refreshCount++;
        return respond(config, 200, session);
      }
      return respond(config, 401, {});
    });

    await expect(getMe()).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshCount).toBe(1);
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, user: null, isAuthenticated: false });
  });

  it("does not renew a forbidden request", async () => {
    useAuthStore.getState().actions.login("valid", empresa);
    server((config) => respond(config, 403, {}));

    await expect(getMe()).rejects.toMatchObject({ response: { status: 403 } });
    expect(useAuthStore.getState().accessToken).toBe("valid");
  });
});
