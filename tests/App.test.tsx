import { renderWithAuth as render } from "./support/render-with-auth";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import App from "@/App";
import router from "@/routes";
import { api } from "@/services/api";
import { useAuthStore } from "@/lib/auth-token";
import { queryClient } from "@/lib/query-client";

const company = { id: 12, nome: "Quimia", email: "quimia@example.com" };
const profile = { ...company, cnpj: "11222333000181", fotoUrl: null, ativo: true };
const originalAdapter = api.defaults.adapter;

function respond(config: InternalAxiosRequestConfig, status: number, data: unknown) {
  const response = {
    config,
    status,
    data,
    statusText: String(status),
    headers: new AxiosHeaders(),
  };
  return status >= 400
    ? Promise.reject(
        new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, response),
      )
    : Promise.resolve(response);
}

async function open(path: string) {
  await act(async () => {
    await router.navigate(path);
  });
  render(<App />);
  await settlePage();
}

async function settlePage() {
  await act(async () => vi.dynamicImportSettled());
  await waitFor(
    () => {
      expect(document.querySelector("[data-route-loading]")).not.toBeInTheDocument();
    },
    { timeout: 5000 },
  );
}

beforeAll(async () => {
  // Compile the real lazy modules before timing route behavior in a cold test worker.
  await Promise.all([
    import("@/pages/Login"),
    import("@/pages/Signup"),
    import("@/pages/ResetPassword"),
    import("@/pages/PasswordResetSuccess"),
    import("@/pages/Home"),
    import("@/pages/Products"),
    import("@/pages/Graphs"),
    import("@/pages/Profile"),
    import("@/pages/NotFound"),
  ]);
}, 30000);

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  queryClient.clear();
  localStorage.clear();
  useAuthStore.getState().actions.logout();
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(async () => {
  cleanup();
  await queryClient.cancelQueries();
  queryClient.clear();
  api.defaults.adapter = originalAdapter;
  useAuthStore.getState().actions.logout();
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(() => router.dispose());

describe("Application routes and providers", { timeout: 10000 }, () => {
  it.each(["/recuperar-senha", "/recover-password", "/reset-password"])(
    "opens an emailed reset link through the actual router at %s",
    async (path) => {
      await open(`${path}?token=email-token`);
      expect(await screen.findByRole("heading", { name: "Resete a senha" })).toBeInTheDocument();
    },
  );

  it("does not claim a password changed when the success URL is opened directly", async () => {
    await open("/reset-password/success");
    expect(await screen.findByRole("heading", { name: "Esqueceu a senha?" })).toBeInTheDocument();
    expect(screen.queryByText("Senha alterada com sucesso!")).not.toBeInTheDocument();
  });

  it("shows success through the real router only after resetting and replaces the token URL", async () => {
    const user = userEvent.setup();
    api.defaults.adapter = (config) => respond(config, 204, null);
    await open("/recuperar-senha?token=email-token");
    await user.type(await screen.findByLabelText("Criar senha"), "Empresa456");
    await user.type(screen.getByLabelText("Confirmar sua senha"), "Empresa456");
    await user.click(screen.getByRole("button", { name: "Resetar senha" }));
    await settlePage();
    expect(
      await screen.findByRole("heading", { name: "Senha alterada com sucesso!" }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/reset-password/success");
    expect(router.state.location.search).toBe("");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("keeps a valid session on Products when its endpoint rejects a freshly renewed token", async () => {
    useAuthStore.getState().actions.login("valid", company);
    let productCalls = 0;
    let refreshCalls = 0;
    api.defaults.adapter = (config) => {
      if (config.url === "/empresas/me/produtos") {
        productCalls++;
        return respond(config, 401, { detail: "nao_autenticado" });
      }
      if (config.url === "/empresas/auth/refresh") {
        refreshCalls++;
        return respond(config, 200, {
          accessToken: "renewed",
          tokenType: "Bearer",
          expiresIn: 900,
          empresa: company,
        });
      }
      return respond(config, 200, profile);
    };
    await open("/products");

    const results = await screen.findByRole("region", { name: "Resultados de produtos" });
    expect(await within(results).findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar os produtos",
    );
    expect(router.state.location.pathname).toBe("/products");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(productCalls).toBe(2);
    expect(refreshCalls).toBe(1);
  });

  it("returns to a protected deep link after login and loads the complete profile", async () => {
    let authenticated = false;
    api.defaults.adapter = (config) => {
      if (config.url?.endsWith("/login")) {
        expect(JSON.parse(config.data)).toEqual({ email: company.email, senha: "password123" });
        authenticated = true;
        return respond(config, 200, {
          accessToken: "valid",
          tokenType: "Bearer",
          expiresIn: 900,
          empresa: company,
        });
      }
      return respond(
        config,
        authenticated ? 200 : 401,
        authenticated ? profile : { detail: "nao_autenticado" },
      );
    };
    await open("/profile?tab=company#details");
    const user = userEvent.setup();

    expect(await screen.findByRole("button", { name: "Entrar" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/login");
    await user.type(screen.getByLabelText("E-mail"), company.email);
    await user.type(screen.getByLabelText("Senha"), "password123");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await settlePage();

    expect(await screen.findByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
    expect(router.state.location).toMatchObject({
      pathname: "/profile",
      search: "?tab=company",
      hash: "#details",
    });
    expect(queryClient.getQueryData(["auth", "user"])).toEqual(profile);
    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
  });

  it("provides URL state to product search when navigating through the actual menu", async () => {
    useAuthStore.getState().actions.login("valid", company);
    api.defaults.adapter = (config) =>
      respond(
        config,
        200,
        config.url === "/empresas/me/produtos"
          ? { itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 }
          : profile,
      );
    await open("/");
    expect(await screen.findByRole("heading", { name: "Home", level: 1 })).toBeVisible();

    const user = userEvent.setup();
    await user.click(screen.getByRole("link", { name: "Produtos" }));
    await settlePage();
    expect(
      await screen.findByRole("heading", { name: "Produtos cadastrados", level: 1 }),
    ).toBeVisible();
    await user.type(screen.getByRole("searchbox"), "detergente");

    await waitFor(() =>
      expect(new URLSearchParams(router.state.location.search).get("q")).toBe("detergente"),
    );
    expect(router.state.location.pathname).toBe("/products");
  });

  it("applies the saved theme across protected sections", async () => {
    useAuthStore.getState().actions.login("valid", company);
    localStorage.setItem("quimia:theme", "dark");
    api.defaults.adapter = (config) => respond(config, 200, profile);
    await open("/graphs");

    expect(await screen.findByRole("heading", { name: "Estatísticas", level: 1 })).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
    await userEvent.setup().click(screen.getByRole("link", { name: "Perfil" }));
    await settlePage();

    expect(await screen.findByRole("heading", { name: "Perfil", level: 1 })).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("opens signup from the login screen without a company session", async () => {
    await open("/login");
    await userEvent.setup().click(screen.getByRole("link", { name: "Crie já" }));
    await settlePage();

    expect(await screen.findByRole("button", { name: "Cadastrar" })).toBeVisible();
    expect(screen.getByLabelText("CNPJ")).toBeVisible();
    expect(router.state.location.pathname).toBe("/signup");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("offers a working way home for an unknown route", async () => {
    useAuthStore.getState().actions.login("valid", company);
    api.defaults.adapter = (config) => respond(config, 200, profile);
    await open("/route-that-does-not-exist");

    expect(screen.getByRole("heading", { name: "Página não encontrada" })).toBeVisible();
    await userEvent.setup().click(screen.getByRole("link", { name: "Voltar para Home" }));
    await settlePage();

    expect(await screen.findByRole("heading", { name: "Home", level: 1 })).toBeVisible();
    expect(router.state.location.pathname).toBe("/");
  });
});
