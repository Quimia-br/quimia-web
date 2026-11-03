import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vite-plus/test";
import type { EmpresaMe } from "@/types/Empresa";
import { api } from "@/services/api";
import { getMe, updateMe, uploadProfilePhoto } from "@/services/empresas";

const profile: EmpresaMe = {
  id: 1,
  nome: "Quimia",
  email: "quimia@example.com",
  cnpj: "11222333000181",
  fotoUrl: null,
  ativo: true,
};
const originalAdapter = api.defaults.adapter;

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe("Empresa profile", () => {
  it("bypasses a cached HTTP error page without adding a CORS request header", async () => {
    api.defaults.adapter = async (config) => {
      expect(config.headers.has("Cache-Control")).toBe(false);
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        data:
          api.getUri(config) === "/api/v1/empresas/me"
            ? "<!doctype html><html><title>Erro Interno</title></html>"
            : profile,
      };
    };
    await expect(getMe()).resolves.toEqual(profile);
  });

  it.each([
    "<!doctype html><html><title>Erro Interno</title></html>",
    {},
    { ...profile, nome: undefined },
    { ...profile, email: undefined },
  ])("rejects an HTTP 200 profile response without company data: %j", async (data) => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      data,
    });
    await expect(getMe()).rejects.toMatchObject({ code: "ERR_BAD_RESPONSE" });
  });

  it.each([
    "<!doctype html><html><title>Unexpected page</title></html>",
    {},
    { fotoUrl: null },
    { fotoUrl: "" },
    { fotoUrl: "javascript:alert(1)" },
  ])("rejects an HTTP 200 upload that does not confirm a usable photo URL: %j", async (data) => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      data,
    });
    await expect(
      uploadProfilePhoto(new File(["RIFFxxxxWEBP"], "foto.webp", { type: "image/webp" })),
    ).rejects.toMatchObject({ code: "ERR_BAD_RESPONSE" });
  });

  it("uploads the selected photo through the existing dedicated photo endpoint", async () => {
    const image = new File(["RIFFxxxxWEBP"], "foto.webp", { type: "image/webp" });
    api.defaults.adapter = async (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/empresas/me/foto");
      expect(config.data).toBeInstanceOf(FormData);
      expect(config.data.has("nome")).toBe(false);
      expect(config.data.has("email")).toBe(false);
      expect(config.data.get("imagem")).toBe(image);
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        data: { fotoUrl: "https://example.com/foto.webp" },
      };
    };
    expect(await uploadProfilePhoto(image)).toEqual({ fotoUrl: "https://example.com/foto.webp" });
  });
  it("preserves the complete profile, including a missing photo and account status", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
      data: profile,
    });

    expect(await getMe()).toEqual(profile);
  });

  it("updates only the supplied profile field", async () => {
    api.defaults.adapter = async (config) => {
      expect(config.method).toBe("patch");
      expect(config.url).toBe("/empresas/me");
      expect(JSON.parse(config.data)).toEqual({ email: "updated@example.com" });
      return {
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
        data: { ...profile, email: "updated@example.com" },
      };
    };

    expect(await updateMe({ email: "updated@example.com" })).toEqual({
      ...profile,
      email: "updated@example.com",
    });
  });
});
