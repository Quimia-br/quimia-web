import { renderWithAuth as render } from "../support/render-with-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AxiosError, AxiosHeaders } from "axios";
import type { ComponentProps } from "react";
import type Cropper from "react-easy-crop";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import Profile from "@/pages/Profile";
import { AccessibilityProvider } from "@/lib/accessibility-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { api } from "@/services/api";
import { useAuthStore } from "@/lib/auth-token";
import { authKeys } from "@/hooks/use-user";
import { getCroppedImg } from "@/lib/utils/getCroppedImg";

vi.mock("@/lib/utils/getCroppedImg", () => ({ getCroppedImg: vi.fn() }));
// jsdom cannot lay out or decode the cropper image.
vi.mock("react-easy-crop", () => ({
  default: (props: ComponentProps<typeof Cropper>) => (
    <img
      src={props.image}
      alt="Imagem para recorte"
      onLoad={() => {
        props.onMediaLoaded?.({ width: 246, height: 246, naturalWidth: 500, naturalHeight: 500 });
        props.onCropAreaChange?.(
          { x: 0, y: 0, width: 100, height: 100 },
          { x: 0, y: 0, width: 246, height: 246 },
        );
      }}
    />
  ),
}));

const company = {
  id: 1,
  nome: "Quimia",
  email: "perfil@example.com",
  cnpj: "11222333000181",
  fotoUrl: null,
  ativo: true,
};
const adapter = api.defaults.adapter;
vi.setConfig({ testTimeout: 20000 });
let client: QueryClient;

function showProfile() {
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData(authKeys.user(), company);
  return render(
    <QueryClientProvider client={client}>
      <AccessibilityProvider>
        <ThemeProvider>
          <MemoryRouter>
            <Profile />
          </MemoryRouter>
        </ThemeProvider>
      </AccessibilityProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  let previewId = 0;
  vi.stubGlobal(
    "URL",
    class extends URL {
      static createObjectURL = () => `blob:profile-${++previewId}`;
      static revokeObjectURL = () => {};
    },
  );
  vi.mocked(getCroppedImg).mockReset();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
  }));
  localStorage.clear();
  useAuthStore.getState().actions.login("token", company);
});
afterEach(() => {
  vi.unstubAllGlobals();
  client?.clear();
  api.defaults.adapter = adapter;
  localStorage.clear();
  document.documentElement.style.removeProperty("font-size");
  document.documentElement.removeAttribute("data-dyslexic");
  document.documentElement.removeAttribute("data-text-scale");
});

describe("Profile", () => {
  it("shows an error toast and preserves the draft when saving fails", async () => {
    const user = userEvent.setup();
    api.defaults.adapter = async (config) => {
      throw new AxiosError("Request failed", "ERR_BAD_RESPONSE", config, undefined, {
        config,
        status: 500,
        statusText: "Internal Server Error",
        headers: new AxiosHeaders(),
        data: { detail: "erro_interno" },
      });
    };
    showProfile();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog", { name: "Alterar informações do perfil" });
    await user.clear(within(dialog).getByRole("textbox", { name: "Nome" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Nome pendente");
    await user.click(within(dialog).getByRole("button", { name: "Alterar" }));

    expect(await screen.findByText("Não foi possível alterar o perfil")).toBeInTheDocument();
    expect(within(dialog).getByRole("textbox", { name: "Nome" })).toHaveValue("Nome pendente");
    expect(within(dialog).getByRole("button", { name: "Alterar" })).toBeEnabled();
    expect(client.getQueryData(authKeys.user())).toEqual(company);
  });

  it("explains a photo upload 401 in a toast after token renewal and keeps the saved fields", async () => {
    const user = userEvent.setup();
    vi.mocked(getCroppedImg).mockResolvedValue({
      file: new File(["RIFFxxxxWEBP"], "foto.webp", { type: "image/webp" }),
    });
    api.defaults.adapter = async (config) => {
      const response = { config, status: 200, statusText: "OK", headers: new AxiosHeaders() };
      if (config.method === "patch")
        return { ...response, data: { ...company, nome: "Nome salvo" } };
      if (config.url === "/empresas/auth/refresh")
        return { ...response, data: { accessToken: "renewed", empresa: company } };
      throw new AxiosError("Unauthorized", "ERR_BAD_REQUEST", config, undefined, {
        ...response,
        status: 401,
        statusText: "Unauthorized",
        data: { detail: "nao_autenticado" },
      });
    };
    showProfile();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog", { name: "Alterar informações do perfil" });
    await user.clear(within(dialog).getByRole("textbox", { name: "Nome" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Nome" }), "Nome salvo");
    await user.upload(
      within(dialog).getByLabelText("Carregar imagem de Foto do perfil", { selector: "input" }),
      new File(["RIFFxxxxWEBP"], "foto.png", { type: "image/png" }),
    );
    fireEvent.load(await screen.findByRole("img", { name: "Imagem para recorte" }));
    await user.click(screen.getByRole("button", { name: "Confirmar recorte" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Editar imagem" })).not.toBeInTheDocument(),
    );
    await user.click(within(dialog).getByRole("button", { name: "Alterar" }));

    expect(await screen.findByText("Não foi possível alterar o perfil")).toBeInTheDocument();
    const notice = within(dialog).getByRole("region", { name: "Avisos de edição do perfil" });
    expect(notice).toHaveTextContent(/Nome\/e-mail salvos/);
    expect(notice).toHaveTextContent(/autenticar.*sessão.*Entre novamente/);
    expect(client.getQueryData(authKeys.user())).toMatchObject({
      nome: "Nome salvo",
      fotoUrl: null,
    });
    expect(within(dialog).getByRole("button", { name: "Descartar nova foto" })).toBeEnabled();
  });

  it("opens the Figma dialog, validates changes and saves through the existing JSON API", async () => {
    const user = userEvent.setup();
    api.defaults.adapter = async (config) => {
      expect(config.data).toBe(JSON.stringify({ nome: "Nova empresa" }));
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        data: { ...company, nome: "Nova empresa" },
      };
    };
    showProfile();
    expect(screen.getByText(company.email)).toBeVisible();
    expect(
      screen
        .getByRole("region", { name: "Perfil da empresa" })
        .querySelector('[data-slot="scroll-area-viewport"]'),
    ).toContainElement(screen.getByText(company.email));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    const dialog = screen.getByRole("dialog", { name: "Alterar informações do perfil" });
    expect(within(dialog).getByRole("button", { name: "Alterar" })).toBeDisabled();
    const name = within(dialog).getByRole("textbox", { name: "Nome" });
    expect(
      within(dialog)
        .getByRole("region", { name: "Conteúdo da edição do perfil" })
        .querySelector('[data-slot="scroll-area-viewport"]'),
    ).toContainElement(name);
    const email = within(dialog).getByRole("textbox", { name: "E-mail vinculado" });
    await user.clear(email);
    await user.type(email, "invalido");
    await user.tab();
    expect(within(dialog).getByText("E-mail inválido")).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Alterar" })).toBeDisabled();
    await user.clear(email);
    await user.type(email, company.email);
    await user.clear(name);
    await user.type(name, "Nova empresa");
    await user.click(within(dialog).getByRole("button", { name: "Alterar" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Alterar informações do perfil" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Nova empresa")).toBeVisible();
    expect(useAuthStore.getState().user?.nome).toBe("Nova empresa");
    expect(client.getQueryData(authKeys.user())).toMatchObject({ nome: "Nova empresa" });
    expect(await screen.findByText("Perfil alterado com sucesso")).toBeVisible();
  });

  it("discards a cancelled draft", async () => {
    const user = userEvent.setup();
    showProfile();
    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.clear(screen.getByRole("textbox", { name: "Nome" }));
    await user.type(screen.getByRole("textbox", { name: "Nome" }), "Rascunho");
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Editar" }));
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveValue(company.nome);
  });

  it("applies preferences globally and resets font, size and theme together", async () => {
    const user = userEvent.setup();
    showProfile();
    const fontSwitch = screen.getByRole("switch", { name: "Dislexic Font" });
    expect(fontSwitch.tagName).toBe("BUTTON");
    await user.click(fontSwitch);
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "true");
    await user.keyboard(" ");
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "false");
    await user.keyboard("{Enter}");
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "true");
    const slider = screen.getByRole("slider", { name: "Tamanho do texto" });
    slider.focus();
    await user.keyboard("{End}");
    expect(document.documentElement.style.fontSize).toBe("200%");
    await user.click(screen.getByRole("radio", { name: "Escuro" }));
    expect(document.documentElement).toHaveClass("dark");
    await user.click(screen.getByRole("button", { name: "Resetar configurações" }));
    expect(document.documentElement.style.fontSize).toBe("100%");
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "false");
    expect(screen.getByRole("radio", { name: "Sistema" })).toBeChecked();
  });
});
