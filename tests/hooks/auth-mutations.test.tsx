import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { PropsWithChildren } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import { authKeys } from "@/hooks/use-user";
import { useLogout } from "@/hooks/use-logout";
import { useLogin } from "@/hooks/use-login";
import { useUser } from "@/hooks/use-user";
import { register as registerCompany } from "@/services/auth";

const empresa = { id: 1, nome: "Omo", email: "omo@example.com" };
const profile = {
  ...empresa,
  cnpj: "11222333000181",
  fotoUrl: "https://example.com/profile.png",
  ativo: true,
};
const originalAdapter = api.defaults.adapter;

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 30_000 }, mutations: { retry: false } },
  });
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
    vi.restoreAllMocks();
  });

  it("does not authenticate the newly registered company", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 201,
      statusText: "Created",
      headers: new AxiosHeaders(),
      data: empresa,
    });

    await registerCompany({
      nome: "Omo",
      cnpj: "11222333000181",
      email: empresa.email,
      senha: "senhaOmo123",
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("keeps the current identity when registering a different company", async () => {
    const currentCompany = { ...empresa, id: 7, nome: "Empresa atual" };
    useAuthStore.getState().actions.login("current-session", currentCompany);
    api.defaults.adapter = async (config) => ({
      config,
      status: 201,
      statusText: "Created",
      headers: new AxiosHeaders(),
      data: empresa,
    });

    await registerCompany({
      nome: empresa.nome,
      cnpj: "11222333000181",
      email: empresa.email,
      senha: "senhaOmo123",
    });

    expect(useAuthStore.getState().user).toEqual(currentCompany);
    expect(useAuthStore.getState().accessToken).toBe("current-session");
  });

  it("fetches the complete profile after login instead of caching the login summary", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      data: config.url?.endsWith("/login") ? { accessToken: "valid", empresa } : profile,
    });
    const { client, wrapper } = setup();
    client.setQueryData(authKeys.user(), { ...profile, id: 7, nome: "Empresa anterior" });
    const mutation = renderHook(() => useLogin(), { wrapper });

    await act(async () => {
      await mutation.result.current.mutateAsync({ email: empresa.email, senha: "password123" });
    });
    const query = renderHook(() => useUser(), { wrapper });
    await waitFor(() => expect(query.result.current.data).toEqual(profile));

    expect(client.getQueryData(authKeys.user())).toEqual(profile);
    client.clear();
  });

  it.each([204, 503])(
    "clears local identity and cached profile on logout with HTTP %s",
    async (status) => {
      useAuthStore.getState().actions.login("valid", empresa);
      api.defaults.adapter = async (config) => {
        const response = {
          config,
          status,
          statusText: String(status),
          headers: new AxiosHeaders(),
          data: null,
        };
        if (status >= 400)
          throw new AxiosError("Unavailable", "ERR_BAD_RESPONSE", config, undefined, response);
        return response;
      };
      const { client, wrapper } = setup();
      client.setQueryData(authKeys.user(), empresa);
      const { result } = renderHook(() => useLogout(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync().catch(() => undefined);
      });

      expect(client.getQueryData(authKeys.user())).toBeUndefined();
      expect(useAuthStore.getState()).toMatchObject({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      });
    },
  );

  it("does not remove a newer session's profile when an older logout finishes", async () => {
    useAuthStore.getState().actions.login("valid", empresa);
    let finish!: () => void;
    const started = new Promise<void>((resolve) => {
      api.defaults.adapter = async (config) => {
        resolve();
        await new Promise<void>((complete) => {
          finish = complete;
        });
        return {
          config,
          status: 204,
          statusText: "No Content",
          headers: new AxiosHeaders(),
          data: null,
        };
      };
    });
    const { client, wrapper } = setup();
    const mutation = renderHook(() => useLogout(), { wrapper });
    const otherProfile = { ...profile, id: 2, nome: "Outra empresa" };

    await act(async () => {
      const pending = mutation.result.current.mutateAsync();
      await started;
      useAuthStore.getState().actions.login("other-token", otherProfile);
      client.setQueryData(authKeys.user(), otherProfile);
      finish();
      await pending;
    });

    expect(client.getQueryData(authKeys.user())).toEqual(otherProfile);
    expect(useAuthStore.getState().accessToken).toBe("other-token");
    client.clear();
  });

  it.each(["login", "logout"] as const)(
    "does not affect a newer session while %s cancellation settles",
    async (operation) => {
      useAuthStore.getState().actions.login("old-token", empresa);
      api.defaults.adapter = async (config) => ({
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        data: { accessToken: "renewed", empresa },
      });
      const { client, wrapper } = setup();
      let announceCancellation!: () => void;
      let finishCancellation!: () => void;
      const started = new Promise<void>((resolve) => {
        announceCancellation = resolve;
      });
      const finish = new Promise<void>((resolve) => {
        finishCancellation = resolve;
      });
      const cancelQueries = client.cancelQueries.bind(client);
      vi.spyOn(client, "cancelQueries").mockImplementation(async (...args) => {
        const canceled = cancelQueries(...args);
        announceCancellation();
        await finish;
        await canceled;
      });
      const mutation = renderHook(() => ({ login: useLogin(), logout: useLogout() }), { wrapper });
      const otherProfile = { ...profile, id: 2, nome: "Outra empresa" };

      await act(async () => {
        const pending =
          operation === "login"
            ? mutation.result.current.login.mutateAsync({
                email: empresa.email,
                senha: "password123",
              })
            : mutation.result.current.logout.mutateAsync();
        await started;
        useAuthStore.getState().actions.login("other-token", otherProfile);
        client.setQueryData(authKeys.user(), otherProfile);
        finishCancellation();
        await pending;
      });

      expect(client.getQueryData(authKeys.user())).toEqual(otherProfile);
      expect(useAuthStore.getState().accessToken).toBe("other-token");
      client.clear();
    },
  );
});
