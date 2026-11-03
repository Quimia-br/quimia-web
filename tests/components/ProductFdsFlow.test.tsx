import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ProductCreateDialog from "@/components/ProductCreateDialog";
import { ToastProvider } from "@/components/Toast";
import { api } from "@/services/api";
import { AuthProvider } from "@/lib/auth-provider";
import { cleanAnalysis, pendingAnalysis, registeredProduct } from "../fixtures/fds";

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const pdf = (name = "seguranca.pdf") =>
  new File(["%PDF-1.7\nFDS"], name, { type: "application/pdf" });
function response(config: InternalAxiosRequestConfig, data: unknown, status = 200) {
  if (
    config.url?.endsWith("/assincronas") &&
    data &&
    typeof data === "object" &&
    "analiseId" in data
  ) {
    data = { id: "job-1", status: "concluida", analise: data, codigo: null, detail: null };
    status = 202;
  }
  return { config, data, status, statusText: String(status), headers: new AxiosHeaders() };
}
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <ProductCreateDialog />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}
async function start() {
  await userEvent.setup().click(screen.getByRole("button", { name: "Cadastrar produto" }));
  fireEvent.change(screen.getByRole("textbox", { name: "Nome" }), {
    target: { value: "Limpa vidros" },
  });
  const user = userEvent.setup();
  const type = screen.getByRole("combobox", { name: "Tipo" });
  await waitFor(() => expect(type).toBeEnabled());
  await user.click(type);
  await user.click(await screen.findByRole("option", { name: "Limpeza geral" }));
  await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
}
async function selectPdf(file = pdf()) {
  fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), { target: { files: [file] } });
  await screen.findByText(file.name);
}
async function analyze() {
  await selectPdf();
  await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("heading", { name: "Pendências identificadas" });
}
beforeEach(() => {
  vi.stubGlobal("matchMedia", (media: string) => ({
    matches: false,
    media,
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
  api.defaults.adapter = async (config) =>
    response(
      config,
      config.url?.endsWith("/tipos")
        ? ["limpeza_geral"]
        : config.url?.endsWith("/assincronas")
          ? cleanAnalysis
          : { situacao: "criado", produto: registeredProduct },
    );
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});
describe("Product FDS registration", () => {
  it("preserves the reviewed FDS and fields when registration returns HTML with HTTP 200", async () => {
    let attempts = 0;
    const adapter = api.defaults.adapter as AxiosAdapter;
    api.defaults.adapter = async (config) => {
      if (config.url === "/empresas/me/produtos" && config.method === "post") {
        if (++attempts === 1) return response(config, "<html><title>Erro Interno</title></html>");
        expect((config.data as FormData).get("analiseFds")).toBe("analise-1");
        return response(config, { situacao: "criado", produto: registeredProduct }, 201);
      }
      if (config.url?.endsWith("/assincronas")) return response(config, pendingAnalysis);
      return adapter(config);
    };
    setup();
    await start();
    await analyze();
    await userEvent.setup().click(screen.getByRole("button", { name: "Adicionar mesmo assim" }));
    await waitFor(() =>
      expect(screen.getByRole("region", { name: "Avisos do cadastro" })).toHaveTextContent(
        "O servidor não confirmou o cadastro",
      ),
    );
    expect(screen.getByRole("dialog", { name: "Pendências identificadas" })).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Editar dados do produto" }));
    expect(screen.getByRole("textbox", { name: "Nome" })).toHaveValue("Limpa vidros");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("seguranca.pdf")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await userEvent.setup().click(screen.getByRole("button", { name: "Adicionar mesmo assim" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(attempts).toBe(2);
  });

  it("locks removal and dismissal until the temporary PDF has been discarded", async () => {
    let release: (() => void) | undefined;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/descartar")) {
        await new Promise<void>((resolve) => {
          release = resolve;
        });
        return response(config, undefined, 204);
      }
      return response(config, pendingAnalysis);
    };
    setup();
    await start();
    await analyze();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Substituir documento corrigido" }));
    await selectPdf(pdf("corrigida.pdf"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Remover FDS" }));
    const confirmation = await screen.findByRole("dialog", { name: "Remover a FDS selecionada?" });
    await userEvent
      .setup()
      .click(within(confirmation).getByRole("button", { name: "Remover arquivo" }));
    expect(within(confirmation).getByRole("button", { name: "Voltar" })).toBeDisabled();
    await userEvent.setup().keyboard("{Escape}");
    expect(confirmation).toBeInTheDocument();
    await act(async () => {
      release?.();
    });
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Remover a FDS selecionada?" }),
      ).not.toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: /Adicionar arquivo/ })).toBeEnabled();
  });
  it("analyzes once and registers the identifier directly from the clean result", async () => {
    const requests: InternalAxiosRequestConfig[] = [];
    const adapter = api.defaults.adapter as AxiosAdapter;
    api.defaults.adapter = async (config) => {
      if (config.method === "post") requests.push(config);
      return adapter(config);
    };
    setup();
    await start();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeDisabled();
    await analyze();
    expect(screen.getByText("Nenhuma pendência foi encontrada.")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(requests).toHaveLength(2);
    expect(requests[0].url).toBe("/empresas/me/produtos/fds/analises/assincronas");
    expect((requests[0].data as FormData).get("fds")).toBeInstanceOf(File);
    const saved = requests[1].data as FormData;
    expect(saved.get("analiseFds")).toBe("analise-1");
    expect(saved.has("fds")).toBe(false);
    expect(saved.has("correcoesFds")).toBe(false);
  });
  it("corrects only a missing concentration unit and allows undoing the correction", async () => {
    let saved: FormData | undefined;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/assincronas")) return response(config, pendingAnalysis);
      saved = config.data as FormData;
      return response(config, { situacao: "criado", produto: registeredProduct });
    };
    setup();
    await start();
    await analyze();
    expect(screen.getByText("Texto evidência")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Marcar como resolvido" }));
    const unit = screen.getByRole("textbox", { name: "Unidade de concentração" });
    fireEvent.change(unit, { target: { value: "\t" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Salvar correção" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/unidade/);
    fireEvent.change(unit, { target: { value: "%" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Salvar correção" }));
    await userEvent.setup().click(screen.getByRole("button", { name: "Marcar como pendência" }));
    expect(screen.getByRole("button", { name: "Adicionar mesmo assim" })).toBeEnabled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Marcar como resolvido" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Unidade de concentração" }), {
      target: { value: "%" },
    });
    await userEvent.setup().click(screen.getByRole("button", { name: "Salvar correção" }));
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(saved).toBeDefined());
    expect(JSON.parse(saved!.get("correcoesFds") as string)).toEqual([
      { indice: 0, unidadeConcentracao: "%" },
    ]);
    expect(saved!.has("fdsComplementos")).toBe(false);
  });
  it("explicitly accepts warnings without inventing corrections", async () => {
    let saved: FormData | undefined;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/assincronas"))
        return response(config, {
          ...pendingAnalysis,
          pendencias: [
            {
              ...pendingAnalysis.pendencias[0],
              corrigivel: false,
              composto: null,
              campo: "secao",
              secao: "10",
            },
          ],
        });
      saved = config.data as FormData;
      return response(config, { situacao: "criado", produto: registeredProduct });
    };
    setup();
    await start();
    await analyze();
    expect(screen.queryByRole("button", { name: "Marcar como resolvido" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Adicionar mesmo assim" }));
    await waitFor(() => expect(saved).toBeDefined());
    expect(saved!.has("correcoesFds")).toBe(false);
  });
  it("replaces through analiseAnterior and registers the new identifier", async () => {
    let reads = 0;
    let saved: FormData | undefined;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/assincronas")) {
        if (++reads === 1) return response(config, pendingAnalysis);
        expect((config.data as FormData).get("analiseAnterior")).toBe("analise-1");
        expect(((config.data as FormData).get("fds") as File).name).toBe("corrigida.pdf");
        return response(config, { ...cleanAnalysis, analiseId: "analise-2" });
      }
      saved = config.data as FormData;
      return response(config, { situacao: "criado", produto: registeredProduct });
    };
    setup();
    await start();
    await analyze();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Substituir documento corrigido" }));
    expect(screen.getByRole("heading", { name: "Alterar FDS" })).toBeInTheDocument();
    await selectPdf(pdf("corrigida.pdf"));
    await userEvent.setup().click(screen.getByRole("button", { name: "Adicionar produto" }));
    await screen.findByText("Nenhuma pendência foi encontrada.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(saved?.get("analiseFds")).toBe("analise-2"));
  });
  it("discards the analyzed PDF when closing without saving", async () => {
    const discarded: string[] = [];
    const adapter = api.defaults.adapter as AxiosAdapter;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/descartar")) {
        discarded.push(JSON.parse(config.data as string).analiseId);
        return response(config, undefined, 204);
      }
      return adapter(config);
    };
    setup();
    await start();
    await analyze();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Fechar cadastro de produto" }));
    const confirmation = await screen.findByRole("dialog", {
      name: "Tem certeza que deseja cancelar a análise da FDS?",
    });
    await userEvent.setup().click(within(confirmation).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(discarded).toEqual(["analise-1"]);
  });
  it("discards a result that arrives after cancellation", async () => {
    let release: (() => void) | undefined;
    let discarded = false;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/descartar")) {
        discarded = true;
        return response(config, undefined, 204);
      }
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return response(config, cleanAnalysis);
    };
    setup();
    await start();
    await selectPdf();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("heading", { name: "Estamos analisando sua FDS" });
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Fechar cadastro de produto" }));
    const confirmation = await screen.findByRole("dialog", {
      name: "Tem certeza que deseja cancelar a análise da FDS?",
    });
    await userEvent.setup().click(within(confirmation).getByRole("button", { name: "Cancelar" }));
    await act(async () => {
      release?.();
    });
    await waitFor(() => expect(discarded).toBe(true));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps the PDF on failure and allows retry", async () => {
    let calls = 0;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (++calls === 1)
        return response(
          config,
          {
            id: "job-1",
            status: "falhou",
            analise: null,
            codigo: 503,
            detail: "extrator_indisponivel",
          },
          202,
        );
      return response(config, cleanAnalysis);
    };
    setup();
    await start();
    await selectPdf();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/indisponível/);
    expect(screen.getByText("seguranca.pdf")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText("Nenhuma pendência foi encontrada.")).toBeInTheDocument();
  });
  it("recovers from an expired identifier without losing the draft", async () => {
    let reads = 0;
    let saves = 0;
    api.defaults.adapter = async (config) => {
      if (config.url?.endsWith("/tipos")) return response(config, ["limpeza_geral"]);
      if (config.url?.endsWith("/assincronas"))
        return response(config, { ...cleanAnalysis, analiseId: `analise-${++reads}` });
      if (++saves === 1)
        throw new AxiosError(
          "Gone",
          "ERR_BAD_REQUEST",
          config,
          undefined,
          response(config, { detail: "analise_expirada" }, 410),
        );
      expect((config.data as FormData).get("analiseFds")).toBe("analise-2");
      return response(config, { situacao: "criado", produto: registeredProduct });
    };
    setup();
    await start();
    await analyze();
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/expirou/);
    await userEvent.setup().click(screen.getByRole("button", { name: "Reanalisar FDS" }));
    await screen.findByText("Nenhuma pendência foi encontrada.");
    await userEvent.setup().click(screen.getByRole("button", { name: "Continuar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(reads).toBe(2);
  });
  it("rejects invalid and oversized PDFs", async () => {
    setup();
    await start();
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), {
      target: { files: [new File(["text"], "fake.pdf")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent(/PDF válido/);
    const large = pdf();
    Object.defineProperty(large, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), { target: { files: [large] } });
    expect(await screen.findByRole("alert")).toHaveTextContent(/10 MB/);
  });
});
