import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { PropsWithChildren } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import { authKeys } from "./use-user";
import { useLogout } from "./use-logout";
import { register as registerCompany } from "@/services/auth";

const empresa = { id: 1, nome: "Omo", email: "omo@example.com" };
const originalAdapter = api.defaults.adapter;

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  function wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, wrapper };
}

describe("auth mutation cache", () => {
  beforeEach(() => {
    useAuthStore.getState().actions.logout();
  });

  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  it("does not authenticate the newly registered company", async () => {
    api.defaults.adapter = async (config) => ({ config, status: 201, statusText: "Created", headers: new AxiosHeaders(), data: empresa });
    const { client } = setup();

    await registerCompany({ nome: "Omo", cnpj: "11222333000181", email: empresa.email, senha: "senhaOmo123" });

    expect(client.getQueryData(authKeys.user())).toBeUndefined();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("keeps the current identity when registering a different company", async () => {
    const currentCompany = { ...empresa, id: 7, nome: "Empresa atual" };
    useAuthStore.getState().actions.login("current-session", currentCompany);
    api.defaults.adapter = async (config) => ({ config, status: 201, statusText: "Created", headers: new AxiosHeaders(), data: empresa });
    const { client } = setup();
    client.setQueryData(authKeys.user(), currentCompany);

    await registerCompany({ nome: empresa.nome, cnpj: "11222333000181", email: empresa.email, senha: "senhaOmo123" });

    expect(client.getQueryData(authKeys.user())).toEqual(currentCompany);
    expect(useAuthStore.getState().user).toEqual(currentCompany);
    expect(useAuthStore.getState().accessToken).toBe("current-session");
  });

  it.each([204, 503])("clears local identity and cached profile on logout with HTTP %s", async (status) => {
    useAuthStore.getState().actions.login("valid", empresa);
    api.defaults.adapter = async (config) => {
      const response = { config, status, statusText: String(status), headers: new AxiosHeaders(), data: null };
      if (status >= 400) throw new AxiosError("Unavailable", "ERR_BAD_RESPONSE", config, undefined, response);
      return response;
    };
    const { client, wrapper } = setup();
    client.setQueryData(authKeys.user(), empresa);
    const { result } = renderHook(() => useLogout(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync().catch(() => undefined);
    });

    expect(client.getQueryData(authKeys.user())).toBeUndefined();
    expect(useAuthStore.getState()).toMatchObject({ accessToken: null, user: null, isAuthenticated: false });
  });
});
