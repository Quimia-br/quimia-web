import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api";
import { authKeys } from "@/hooks/use-user";
import type { EmpresaMe } from "@/types/Empresa";
import ProfileContainer from "./ProfileContainer";

const company: EmpresaMe = {
  id: 12,
  nome: "Quimia Laboratório",
  cnpj: "12345678000100",
  email: "quimia@example.com",
  fotoUrl: "https://example.com/profile.png",
};
const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];

afterEach(() => {
  api.defaults.adapter = originalAdapter;
  clients.splice(0).forEach((client) => client.clear());
  vi.restoreAllMocks();
});

function ProfilePath() {
  return <output aria-label="Profile route">{useLocation().pathname}</output>;
}

function renderProfile(initialPath = "/", cachedCompany?: EmpresaMe) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  clients.push(client);
  if (cachedCompany) client.setQueryData(authKeys.user(), cachedCompany);
  const view = render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initialPath]}>
        <ul><ProfileContainer /></ul>
        <ProfilePath />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, client };
}

describe("ProfileContainer", () => {
  it("keeps the profile link named and reachable while user data loads, then displays the avatar", async () => {
    vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(64);
    let finishRequest!: (response: AxiosResponse<EmpresaMe>) => void;
    let request!: InternalAxiosRequestConfig;
    api.defaults.adapter = (config) => {
      request = config;
      return new Promise((resolve) => { finishRequest = resolve; });
    };
    const { client } = renderProfile();

    const link = screen.getByRole("link", { name: "Perfil" });
    expect(link).toHaveAttribute("href", "/profile");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    await waitFor(() => expect(request?.url).toBe("/empresas/me"));
    finishRequest({ data: company, status: 200, statusText: "OK", headers: {}, config: request });

    const image = await screen.findByRole("img", { name: company.nome });
    expect(image).toHaveAttribute("src", company.fotoUrl);
    expect(client.getQueryData(authKeys.user())).toEqual(company);
    expect(link).toHaveAccessibleName("Perfil");
  });

  it("keeps a named fallback link when the user request fails", async () => {
    api.defaults.adapter = () => Promise.reject(new Error("Service unavailable"));
    const { client } = renderProfile();

    await waitFor(() => expect(client.getQueryState(authKeys.user())?.status).toBe("error"));
    const link = screen.getByRole("link", { name: "Perfil" });
    expect(link.querySelector("svg")).toHaveClass("lucide-building");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("allows keyboard navigation when the company has no photo", async () => {
    const user = userEvent.setup();
    renderProfile("/", { ...company, fotoUrl: "" });
    const link = screen.getByRole("link", { name: "Perfil" });

    await user.tab();
    expect(link).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status", { name: "Profile route" })).toHaveTextContent("/profile");
    expect(link).toHaveAttribute("aria-current", "page");
  });

  it("marks nested profile pages active without marking another section", () => {
    renderProfile("/profile/edit", { ...company, fotoUrl: "" });

    expect(screen.getByRole("link", { name: "Perfil" })).toHaveAttribute("aria-current", "page");
  });
});
