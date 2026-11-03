import axios, { AxiosError, AxiosHeaders } from "axios";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/services/api";
import { useAuthStore } from "@/lib/auth-token";
import { login, logout } from "@/services/auth";
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
  const response = {
    config,
    status,
    data,
    statusText: String(status),
    headers: new AxiosHeaders(),
  };
  if (status >= 400) {
    return Promise.reject(
      new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response),
    );
  }
  return Promise.resolve(response);
}

function server(adapter: AxiosAdapter) {
  // Keep the client, interceptors and store real; replace only the network boundary.
  api.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((finish) => {
    resolve = finish;
  });
  return { promise, resolve };
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
      accessToken: "new-access-token",
      user: empresa,
      isAuthenticated: true,
    });
    expect(localStorage.getItem("quimia:auth-storage")).not.toContain("new-access-token");
  });

  it("restores the session after a reload using a bodyless cookie refresh", async () => {
    useAuthStore.setState({
      user: empresa,
      isAuthenticated: true,
      accessToken: null,
      canRefresh: true,
    });
    server((config) => {
      if (config.url?.endsWith("/empresas/auth/refresh")) {
        // EmpresaAuthController rejects even an empty JSON object.
        return respond(config, config.data == null ? 200 : 400, session);
      }
      return respond(
        config,
        config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
        profile,
      );
    });

    expect(await getMe()).toEqual(profile);
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: "new-access-token",
      user: empresa,
      isAuthenticated: true,
    });
  });

  it("restores the cookie session before requesting the company profile after a reload", async () => {
    useAuthStore.setState({
      user: empresa,
      isAuthenticated: true,
      accessToken: null,
      canRefresh: true,
    });
    const requests: string[] = [];
    server((config) => {
      requests.push(`${config.method} ${config.url}`);
      if (config.url === "/empresas/auth/refresh") return respond(config, 200, session);
      return respond(
        config,
        config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
        profile,
      );
    });

    expect(await getMe()).toEqual(profile);
    expect(requests).toEqual(["post /empresas/auth/refresh", "get /empresas/me"]);
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
      return respond(
        config,
        config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
        profile,
      );
    });

    expect(await Promise.all([getMe(), getMe(), getMe()])).toEqual([profile, profile, profile]);
    expect(refreshCount).toBe(1);
  });

  it.each(["login", "register", "forgot-password", "reset-password", "refresh", "logout"])(
    "does not renew or mask a 401 from the %s endpoint",
    async (endpoint) => {
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
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
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
    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it("does not renew a forbidden request", async () => {
    useAuthStore.getState().actions.login("valid", empresa);
    server((config) => respond(config, 403, {}));

    await expect(getMe()).rejects.toMatchObject({ response: { status: 403 } });
    expect(useAuthStore.getState().accessToken).toBe("valid");
  });

  it.each([503, 403, "network"] as const)(
    "preserves the session when refresh fails with %s",
    async (failure) => {
      useAuthStore.getState().actions.login("expired", empresa);
      server((config) => {
        if (config.url?.endsWith("/refresh")) {
          return failure === "network"
            ? Promise.reject(new AxiosError("Network Error", "ERR_NETWORK", config))
            : respond(config, failure, { detail: "temporarily_unavailable" });
        }
        return respond(config, 401, {});
      });

      await expect(getMe()).rejects.toBeInstanceOf(AxiosError);
      expect(useAuthStore.getState()).toMatchObject({
        accessToken: "expired",
        user: empresa,
        isAuthenticated: true,
      });
    },
  );

  it("does not restore a logged-out session when an earlier refresh succeeds", async () => {
    useAuthStore.getState().actions.login("expired", empresa);
    const started = deferred();
    const finish = deferred();
    server(async (config) => {
      if (config.url?.endsWith("/refresh")) {
        started.resolve();
        await finish.promise;
        return respond(config, 200, session);
      }
      if (config.url?.endsWith("/logout")) return respond(config, 204, null);
      return respond(
        config,
        config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
        profile,
      );
    });

    const pending = getMe();
    const rejected = expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await started.promise;
    await logout();
    finish.resolve();
    await rejected;

    expect(useAuthStore.getState()).toMatchObject({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });
  });

  it.each([200, 401])(
    "does not replace a newer login when an old refresh returns HTTP %s",
    async (status) => {
      useAuthStore.getState().actions.login("expired", empresa);
      const started = deferred();
      const finish = deferred();
      const otherCompany = { id: 2, nome: "Outra empresa", email: "other@example.com" };
      server(async (config) => {
        if (config.url?.endsWith("/refresh")) {
          started.resolve();
          await finish.promise;
          return respond(config, status, session);
        }
        return respond(
          config,
          config.headers.Authorization === "Bearer new-access-token" ? 200 : 401,
          profile,
        );
      });

      const pending = getMe();
      const rejected = expect(pending).rejects.toBeDefined();
      await started.promise;
      useAuthStore.getState().actions.login("other-token", otherCompany);
      finish.resolve();
      await rejected;

      expect(useAuthStore.getState()).toMatchObject({
        accessToken: "other-token",
        user: otherCompany,
        isAuthenticated: true,
      });
    },
  );

  it("does not replay an old account request using a newer account token", async () => {
    useAuthStore.getState().actions.login("old-token", empresa);
    const started = deferred();
    const finish = deferred();
    const otherCompany = { id: 2, nome: "Outra empresa", email: "other@example.com" };
    let calls = 0;
    server(async (config) => {
      calls++;
      if (calls === 1) {
        started.resolve();
        await finish.promise;
        return respond(config, 401, {});
      }
      return respond(config, 200, profile);
    });

    const pending = getMe();
    const rejected = expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await started.promise;
    useAuthStore.getState().actions.login("other-token", otherCompany);
    finish.resolve();
    await rejected;
    expect(calls).toBe(1);
  });

  it("does not send a write started by one account using another account's token", async () => {
    useAuthStore.getState().actions.login("old-token", empresa);
    let authorization: unknown;
    server((config) => {
      authorization = config.headers.Authorization;
      return respond(config, 200, {});
    });

    const pending = api.post("/empresas/me/produtos", { nome: "Produto da primeira empresa" });
    useAuthStore.getState().actions.login("other-token", { ...empresa, id: 2 });

    await expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    expect(authorization).toBe("Bearer old-token");
  });

  it("ends the local session before the logout response arrives", async () => {
    useAuthStore.getState().actions.login("valid", empresa);
    const finish = deferred();
    server(async (config) => {
      await finish.promise;
      return respond(config, 204, null);
    });

    const pending = logout();
    const authenticatedWhilePending = useAuthStore.getState().isAuthenticated;
    finish.resolve();
    await pending;

    expect(authenticatedWhilePending).toBe(false);
  });

  it("does not refresh after an explicit logout even when a protected request returns 401", async () => {
    useAuthStore.getState().actions.login("valid", empresa);
    let refreshCount = 0;
    server((config) => {
      if (config.url?.endsWith("/logout")) return respond(config, 204, null);
      if (config.url?.endsWith("/refresh")) {
        refreshCount++;
        return respond(config, 200, session);
      }
      return respond(config, 401, {});
    });

    await logout();
    await expect(getMe()).rejects.toMatchObject({ response: { status: 401 } });
    expect(refreshCount).toBe(0);
  });

  it("does not establish a session when login completes after logout", async () => {
    const started = deferred();
    const finish = deferred();
    server(async (config) => {
      if (config.url?.endsWith("/login")) {
        started.resolve();
        await finish.promise;
        return respond(config, 200, session);
      }
      return respond(config, 204, null);
    });

    const pending = login({ email: empresa.email, senha: "password123" });
    const rejected = expect(pending).rejects.toMatchObject({ code: "ERR_CANCELED" });
    await started.promise;
    await logout();
    finish.resolve();
    await rejected;

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
