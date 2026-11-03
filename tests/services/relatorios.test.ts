import { AxiosHeaders } from "axios";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/services/api";
import {
  getDau,
  getRecommendations,
  getTopProducts,
  getUserProfile,
  getStatistics,
} from "@/services/relatorios";

const originalAdapter = api.defaults.adapter;
afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe("relatórios da empresa", () => {
  it("usa as rotas da empresa autenticada e encaminha cancelamento e limite", async () => {
    const calls: string[] = [];
    const signal = new AbortController().signal;
    api.defaults.adapter = async (config) => {
      calls.push(config.url!);
      expect(config.signal).toBe(signal);
      expect(config.params?.idEmpresa).toBeUndefined();
      if (config.url?.endsWith("top-produtos")) expect(config.params).toEqual({ limite: 5 });
      return {
        config,
        data: config.url?.endsWith("estatisticas") ? { cards: [] } : [],
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    };
    await Promise.all([
      getDau(signal),
      getRecommendations(signal),
      getTopProducts(5, signal),
      getUserProfile(signal),
      getStatistics(signal),
    ]);
    expect(calls).toEqual([
      "/empresas/me/kpis/dau",
      "/empresas/me/kpis/recomendacoes",
      "/empresas/me/kpis/top-produtos",
      "/empresas/me/kpis/perfil-usuarios",
      "/empresas/me/estatisticas",
    ]);
  });

  it("aceita estatísticas ausentes ou nulas no primeiro dia", async () => {
    const rows = [
      { data: "2026-10-28", usuariosAtivos: 12, mediaGlobal: 12, media7d: 12, zScore: null },
    ];
    api.defaults.adapter = async (config) => ({
      config,
      data: rows,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    expect(await getDau()).toEqual(rows);
  });

  it("rejeita HTML de erro e contagens inválidas sem apresentá-los como dados vazios", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      data: "<html>Erro</html>",
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    await expect(getRecommendations()).rejects.toThrow();
    api.defaults.adapter = async (config) => ({
      config,
      data: [{ nivelAcesso: "usuario", estado: "SP", totalUsuarios: -1 }],
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    await expect(getUserProfile()).rejects.toThrow();
  });
});
