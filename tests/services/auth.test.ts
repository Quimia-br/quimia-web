import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import { forgotPassword, logout, register, resetPassword } from "@/services/auth";

const empresa = { id: 1, nome: "Omo", email: "omo@example.com" };
const credentials = {
  nome: "Omo",
  cnpj: "11.222.333/0001-81",
  email: empresa.email,
  senha: "senhaOmo123",
};
const originalAdapter = api.defaults.adapter;

function response(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  return { config, status, data, statusText: String(status), headers: new AxiosHeaders() };
}

describe("authentication service requests", () => {
  beforeEach(() => {
    useAuthStore.getState().actions.logout();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    useAuthStore.getState().actions.logout();
    localStorage.clear();
  });

  it("sends the complete company registration and returns the created summary", async () => {
    let request: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      request = config;
      return response(config, 201, empresa);
    };

    expect(await register(credentials)).toEqual(empresa);
    expect(request).toMatchObject({ method: "post", url: "/empresas/auth/register" });
    expect(JSON.parse(request!.data)).toEqual({
      nome: "Omo",
      cnpj: "11.222.333/0001-81",
      email: "omo@example.com",
      senha: "senhaOmo123",
    });
  });

  it("requests a password recovery with the email in the JSON body", async () => {
    let request: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      request = config;
      return response(config, 204, null);
    };

    await forgotPassword("recover@example.com");

    expect(request).toMatchObject({ method: "post", url: "/empresas/auth/forgot-password" });
    expect(JSON.parse(request!.data)).toEqual({ email: "recover@example.com" });
  });

  it("sends the reset token and new password using the API field names", async () => {
    let request: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      request = config;
      return response(config, 204, null);
    };

    await resetPassword({ resetToken: "one-use-reset-token", novaSenha: "newPassword123" });

    expect(request).toMatchObject({ method: "post", url: "/empresas/auth/reset-password" });
    expect(JSON.parse(request!.data)).toEqual({
      resetToken: "one-use-reset-token",
      novaSenha: "newPassword123",
    });
  });

  it.each([
    ["register", () => register(credentials)],
    ["forgot-password", () => forgotPassword(empresa.email)],
    ["reset-password", () => resetPassword({ resetToken: "expired", novaSenha: "newPassword123" })],
  ] as const)(
    "preserves the server error and active session when %s fails",
    async (_endpoint, operation) => {
      useAuthStore.getState().actions.login("current-token", empresa);
      const version = useAuthStore.getState().sessionVersion;
      api.defaults.adapter = async (config) => {
        throw new AxiosError(
          "Rejected",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          response(config, 422, { detail: "invalid_input" }),
        );
      };

      const result = operation();

      await expect(result).rejects.toMatchObject({
        response: { status: 422, data: { detail: "invalid_input" } },
      });
      expect(useAuthStore.getState()).toMatchObject({
        accessToken: "current-token",
        user: empresa,
        isAuthenticated: true,
        sessionVersion: version,
      });
    },
  );

  it("sends a bodyless logout and propagates a server failure after revoking the local session", async () => {
    useAuthStore.getState().actions.login("current-token", empresa);
    let request: InternalAxiosRequestConfig | undefined;
    api.defaults.adapter = async (config) => {
      request = config;
      throw new AxiosError(
        "Unavailable",
        "ERR_BAD_RESPONSE",
        config,
        undefined,
        response(config, 503, { detail: "unavailable" }),
      );
    };

    await expect(logout()).rejects.toMatchObject({
      response: { status: 503, data: { detail: "unavailable" } },
    });

    expect(request).toMatchObject({ method: "post", url: "/empresas/auth/logout" });
    expect(request!.data).toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      canRefresh: false,
    });
  });
});
