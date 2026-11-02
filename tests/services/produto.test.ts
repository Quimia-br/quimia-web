import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it } from "vite-plus/test";
import { api } from "@/lib/api";
import * as produtos from "@/services/produto";

const originalAdapter = api.defaults.adapter;
const produto = {
  id: 1,
  nome: "Detergente",
  tipo: "limpeza_geral",
  descricao: null,
  codBarras: "7891234567895",
  fotoUrl: null,
  marca: { id: 1, nome: "Quimia", logoUrl: null },
};

function respond(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  return Promise.resolve({
    config,
    data,
    status,
    statusText: String(status),
    headers: new AxiosHeaders(),
  });
}

afterEach(() => {
  api.defaults.adapter = originalAdapter;
});

describe("EmpresaProduto service", () => {
  it.each([
    "<html><title>Erro Interno</title></html>",
    {},
    { itens: null, pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 },
  ])("rejects an invalid list response instead of showing an empty catalog: %j", async (data) => {
    api.defaults.adapter = (config) => respond(config, data);
    await expect(produtos.getAll()).rejects.toThrow("invalid_product_list_response");
  });

  it.each([
    "<html><head><title>Erro Interno</title></head><body>Erro interno</body></html>",
    undefined,
    { situacao: "criado" },
    { produto: { ...produto, id: null }, situacao: "criado" },
    { produto, situacao: "desconhecida" },
  ])("rejects an invalid registration response instead of reporting success: %j", async (data) => {
    api.defaults.adapter = (config) => respond(config, data);
    await expect(
      produtos.create({ nome: "Água destilada", tipo: "outro", analiseFds: "analise-1" }),
    ).rejects.toThrow("invalid_product_creation_response");
  });

  it("previews only the FDS without creating a product", async () => {
    const fds = new File(["%PDF-1.7"], "ficha.pdf", { type: "application/pdf" });
    const controller = new AbortController();
    const analysis = {
      analiseId: "analise-1",
      expiraEm: "2099-01-01T00:00:00Z",
      status: "processado",
      mensagem: null,
      pendencias: [],
      compostos: [],
    };
    api.defaults.adapter = (config) => {
      expect(config.url).toBe("/empresas/me/produtos/fds/analises");
      expect(config.signal).toBe(controller.signal);
      expect(Object.fromEntries((config.data as FormData).entries())).toEqual({ fds });
      return respond(config, analysis);
    };
    expect(await produtos.analyzeFds(fds, controller.signal)).toEqual(analysis);
  });

  it("registers the reviewed analysis and structured corrections without resending the PDF", async () => {
    api.defaults.adapter = (config) => {
      const form = config.data as FormData;
      expect(form.has("fds")).toBe(false);
      expect(form.has("fdsComplementos")).toBe(false);
      expect(form.get("analiseFds")).toBe("analise-1");
      expect(JSON.parse(form.get("correcoesFds") as string)).toEqual([
        { indice: 0, unidadeConcentracao: "%" },
      ]);
      return respond(config, { produto, situacao: "criado" });
    };
    await produtos.create({
      nome: "Detergente",
      tipo: "limpeza_geral",
      analiseFds: "analise-1",
      correcoesFds: [{ indice: 0, unidadeConcentracao: "%" }],
    });
  });

  it("sends the previous analysis identifier in the replacement body", async () => {
    const fds = new File(["%PDF-1.7"], "corrigida.pdf", { type: "application/pdf" });
    api.defaults.adapter = (config) => {
      expect((config.data as FormData).get("analiseAnterior")).toBe("anterior");
      return respond(config, {
        analiseId: "nova",
        expiraEm: "2099-01-01T00:00:00Z",
        status: "processado",
        mensagem: null,
        pendencias: [],
        compostos: [],
      });
    };
    await produtos.analyzeFds(fds, undefined, "anterior");
  });

  it("discards the analysis by POST with the identifier in JSON, never in the URL", async () => {
    api.defaults.adapter = (config) => {
      expect(config.method).toBe("post");
      expect(config.url).toBe("/empresas/me/produtos/fds/analises/descartar");
      expect(JSON.parse(config.data as string)).toEqual({ analiseId: "analise-1" });
      return respond(config, undefined, 204);
    };
    await produtos.discardFdsAnalysis("analise-1");
  });

  it("rejects HTML or an old analysis response before entering review", async () => {
    const fds = new File(["%PDF-1.7"], "ficha.pdf", { type: "application/pdf" });
    for (const data of ["<html>Unavailable</html>", { secoes: [], pendencias: [] }]) {
      api.defaults.adapter = (config) => respond(config, data);
      await expect(produtos.analyzeFds(fds)).rejects.toThrow("invalid_fds_analysis_response");
    }
  });
  it("serializes selected search fields and forwards query cancellation", async () => {
    const controller = new AbortController();
    api.defaults.adapter = (config) => {
      const url = new URL(api.getUri(config), "https://quimia.test");
      expect(url.searchParams.get("fields")).toBe("nome,tipo");
      expect(config.signal).toBe(controller.signal);
      return respond(config, { itens: [], pagina: 0, tamanho: 20, totalItens: 0, totalPaginas: 0 });
    };
    await produtos.getAll({ query: "limpa", fields: ["nome", "tipo"] }, controller.signal);
  });

  it("sends search filters as query parameters and returns the complete page", async () => {
    api.defaults.adapter = (config) => {
      const url = new URL(api.getUri(config), "https://quimia.test");
      expect(url.pathname).toBe("/api/v1/empresas/me/produtos");
      expect(Object.fromEntries(url.searchParams)).toEqual({
        q: "Detergente",
        tipo: "limpeza_geral",
        codBarras: "7891234567895",
        page: "0",
        size: "10",
      });
      return respond(config, {
        itens: [produto],
        pagina: 0,
        tamanho: 10,
        totalItens: 1,
        totalPaginas: 1,
      });
    };

    expect(
      await produtos.getAll({
        query: "Detergente",
        tipo: "limpeza_geral",
        codBarras: "7891234567895",
        page: 0,
        size: 10,
      }),
    ).toEqual({ itens: [produto], pagina: 0, tamanho: 10, totalItens: 1, totalPaginas: 1 });
  });

  it.each([
    [201, "criado"],
    [200, "vinculado"],
    [200, "reativado"],
  ])(
    "uploads the product image and returns the registration result for HTTP %s / %s",
    async (status, situacao) => {
      const imagem = new File(["imagem"], "produto.png", { type: "image/png" });
      api.defaults.adapter = (config) => {
        expect(config.method).toBe("post");
        expect(config.url).toBe("/empresas/me/produtos");
        expect(config.headers.getContentType()).toBe("multipart/form-data");
        expect(config.data).toBeInstanceOf(FormData);
        const body = config.data as FormData;
        expect(Object.fromEntries(body.entries())).toEqual({
          nome: "Detergente",
          tipo: "limpeza_geral",
          descricao: "",
          codBarras: "7891234567895",
          imagem,
        });
        return respond(config, { produto, situacao }, status);
      };

      expect(
        await produtos.create({
          nome: "Detergente",
          tipo: "limpeza_geral",
          descricao: "",
          codBarras: "7891234567895",
          imagem,
        }),
      ).toEqual({ produto, situacao });
    },
  );

  it("omits optional fields from multipart registration when they are absent", async () => {
    api.defaults.adapter = (config) => {
      expect(config.data).toBeInstanceOf(FormData);
      expect(Object.fromEntries((config.data as FormData).entries())).toEqual({
        nome: "Detergente",
        tipo: "limpeza_geral",
      });
      return respond(config, { produto, situacao: "criado" }, 201);
    };

    await produtos.create({ nome: "Detergente", tipo: "limpeza_geral" });
  });

  it("patches only supplied fields so an edit preserves the remaining product data", async () => {
    api.defaults.adapter = (config) => {
      expect(config.method).toBe("patch");
      expect(config.url).toBe("/empresas/me/produtos/1");
      expect(config.headers.getContentType()).toBe("multipart/form-data");
      expect(config.data).toBeInstanceOf(FormData);
      expect(Object.fromEntries((config.data as FormData).entries())).toEqual({
        nome: "Novo nome",
      });
      return respond(config, { ...produto, nome: "Novo nome" });
    };

    expect(await produtos.update(1, { nome: "Novo nome" })).toEqual({
      ...produto,
      nome: "Novo nome",
    });
  });

  it("awaits a bodyless 204 response when removing a product", async () => {
    api.defaults.adapter = (config) => {
      expect(config.method).toBe("delete");
      expect(config.url).toBe("/empresas/me/produtos/1");
      return respond(config, undefined, 204);
    };

    expect(await produtos.remove(1)).toBeUndefined();
  });
});
