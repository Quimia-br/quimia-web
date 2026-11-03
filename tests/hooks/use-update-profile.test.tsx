import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import type { PropsWithChildren } from "react";
import { afterEach, beforeEach, expect, it } from "vite-plus/test";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { authKeys } from "@/hooks/use-user";
import { useAuthStore } from "@/lib/auth-token";
import { api } from "@/services/api";
import { ProfilePhotoError } from "@/lib/profile-photo-error";

const profile = {
  id: 1,
  nome: "Empresa",
  email: "empresa@example.com",
  cnpj: "11222333000181",
  fotoUrl: null,
  ativo: true,
};
const originalAdapter = api.defaults.adapter;
let client: QueryClient;
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  useAuthStore.getState().actions.login("token", profile);
});
afterEach(() => {
  client.clear();
  api.defaults.adapter = originalAdapter;
  localStorage.clear();
});

function wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

it("keeps the saved photo when an upload returns an HTML page with HTTP 200", async () => {
  const saved = { ...profile, fotoUrl: "https://example.com/existente.webp" };
  client.setQueryData(authKeys.user(), saved);
  api.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders({ "Content-Type": "text/html" }),
    data: "<!doctype html><html><title>Unexpected page</title></html>",
  });
  const { result } = renderHook(useUpdateProfile, { wrapper });
  await act(async () => {
    await expect(
      result.current.mutateAsync({
        imagem: new File(["image"], "foto.webp", { type: "image/webp" }),
      }),
    ).rejects.toBeInstanceOf(ProfilePhotoError);
  });
  expect(client.getQueryData(authKeys.user())).toEqual(saved);
});

it("preserves saved fields on photo failure and retries only the remaining photo", async () => {
  client.setQueryData(authKeys.user(), profile);
  let patches = 0;
  let photos = 0;
  api.defaults.adapter = async (config) => {
    const response = {
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      data: {},
    };
    if (config.method === "patch") {
      patches++;
      return { ...response, data: { ...profile, nome: "Nome salvo" } };
    }
    expect(config.url).toBe("/empresas/me/foto");
    photos++;
    if (photos === 1)
      throw new AxiosError("photo failed", "ERR_BAD_RESPONSE", config, undefined, {
        ...response,
        status: 502,
        data: { detail: "armazenamento_imagem_falhou" },
      });
    return { ...response, data: { fotoUrl: "https://example.com/nova.webp" } };
  };
  const image = new File(["image"], "foto.webp", { type: "image/webp" });
  const { result } = renderHook(useUpdateProfile, { wrapper });
  let failure: unknown;
  await act(async () => {
    try {
      await result.current.mutateAsync({ nome: "Nome salvo", imagem: image });
    } catch (error) {
      failure = error;
    }
  });
  expect(failure).toBeInstanceOf(ProfilePhotoError);
  expect(failure).toMatchObject({ fieldsSaved: true });
  expect(client.getQueryData(authKeys.user())).toMatchObject({ nome: "Nome salvo", fotoUrl: null });
  await act(() => result.current.mutateAsync({ imagem: image }));
  expect(patches).toBe(1);
  expect(photos).toBe(2);
  expect(client.getQueryData(authKeys.user())).toMatchObject({
    nome: "Nome salvo",
    fotoUrl: "https://example.com/nova.webp",
  });
});

it("updates the full cache and identity without starting a new session", async () => {
  const session = useAuthStore.getState().sessionVersion;
  api.defaults.adapter = async (config) => ({
    config,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
    data: { ...profile, nome: "Atualizada" },
  });
  const { result } = renderHook(useUpdateProfile, { wrapper });
  await act(() => result.current.mutateAsync({ nome: "Atualizada" }));
  expect(client.getQueryData(authKeys.user())).toMatchObject({ nome: "Atualizada", ativo: true });
  expect(useAuthStore.getState()).toMatchObject({
    sessionVersion: session,
    user: { nome: "Atualizada" },
  });
});

it("does not overwrite a new login when the previous account's PATCH finishes late", async () => {
  let finish!: () => void;
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  api.defaults.adapter = (config) =>
    new Promise((resolve) => {
      finish = () =>
        resolve({
          config,
          status: 200,
          statusText: "OK",
          headers: new AxiosHeaders(),
          data: { ...profile, nome: "Antiga" },
        });
      started();
    });
  const { result } = renderHook(useUpdateProfile, { wrapper });
  act(() => result.current.mutate({ nome: "Antiga" }));
  await requestStarted;
  const other = { ...profile, id: 2, nome: "Outra conta", email: "outra@example.com" };
  act(() => {
    useAuthStore.getState().actions.logout();
    useAuthStore.getState().actions.login("other-token", other);
    client.setQueryData(authKeys.user(), other);
    finish();
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(useAuthStore.getState().user).toMatchObject({ id: 2, nome: "Outra conta" });
  expect(client.getQueryData(authKeys.user())).toEqual(other);
});
