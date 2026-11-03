import { createRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import ProductFdsFlow, { type FdsFlowHandle } from "@/components/ProductFdsFlow";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { analyzeFds, discardFdsAnalysis } from "@/services/produto";
import type { ProductFdsDraft, ProductRegistrationView } from "@/types/ProductRegistration";
import type { FdsAnalysis } from "@/types/Produto";

vi.mock("@/services/produto", () => ({ analyzeFds: vi.fn(), discardFdsAnalysis: vi.fn() }));

const analysis: FdsAnalysis = {
  analiseId: "reviewed-pdf",
  expiraEm: "2099-01-01T00:00:00Z",
  status: "processado_com_pendencias",
  mensagem: null,
  compostos: [],
  pendencias: [
    {
      secao: "3",
      campo: "unidade_concentracao",
      motivo: "ausente",
      descricao: "Informe a unidade.",
      composto: { indice: 0, nome: "Etanol", casNumero: "64-17-5" },
      corrigivel: true,
      evidencias: [{ secao: "3", pagina: 1, textoEvidencia: "Etanol 10" }],
    },
  ],
};
const pdf = () => new File(["%PDF-1.7\nFDS"], "seguranca.pdf", { type: "application/pdf" });
const clients: QueryClient[] = [];

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  clients.push(client);
  const handle = createRef<FdsFlowHandle>();
  const submit = vi.fn();
  function Registration() {
    const [view, setView] = useState<ProductRegistrationView>("upload");
    const [draft, setDraft] = useState<ProductFdsDraft>({
      file: null,
      analyzedFile: null,
      selectionAnalyzed: false,
      analysis: null,
      corrections: [],
    });
    return (
      <ProductFdsFlow
        view={view}
        product={{ nome: "Limpa vidros", tipo: "limpeza_geral" }}
        busy={false}
        error={null}
        flowRef={handle}
        onViewChange={setView}
        onSubmit={submit}
        onEdit={() => {}}
        onCleanupError={() => {}}
        onBeforeAnalyze={async () => true}
        draft={draft}
        onDraftChange={(patch) =>
          setDraft((current) =>
            typeof patch === "function" ? patch(current) : { ...current, ...patch },
          )
        }
      />
    );
  }
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <Registration />
        <ToastViewport />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { handle, submit };
}

async function select(file = pdf()) {
  fireEvent.change(screen.getByLabelText("Arquivo PDF da FDS"), { target: { files: [file] } });
  await screen.findByText(file.name);
}

beforeEach(() => {
  vi.mocked(analyzeFds).mockReset().mockResolvedValue(analysis);
  vi.mocked(discardFdsAnalysis).mockReset().mockResolvedValue(undefined);
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
});
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});

describe("FDS flow refactoring preserves registration behavior", () => {
  it("unlocks file selection after invalid and oversized PDFs, then accepts a valid PDF", async () => {
    setup();
    const input = screen.getByLabelText("Arquivo PDF da FDS");
    fireEvent.change(input, { target: { files: [new File(["invalid"], "fake.pdf")] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("PDF válido");
    await waitFor(() => expect(input).toBeEnabled());
    const large = pdf();
    Object.defineProperty(large, "size", { value: 10 * 1024 * 1024 + 1 });
    fireEvent.change(input, { target: { files: [large] } });
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("10 MB"));
    await waitFor(() => expect(input).toBeEnabled());
    await select();
    expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
    expect(analyzeFds).not.toHaveBeenCalled();
  });

  it("keeps the selected PDF after analysis failure and submits its reviewed correction after retry", async () => {
    vi.mocked(analyzeFds).mockRejectedValueOnce(new Error("Offline"));
    const { submit } = setup();
    const user = userEvent.setup();
    await select();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await screen.findByRole("alert");
    expect(screen.getByText("seguranca.pdf")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(await screen.findByRole("button", { name: "Marcar como resolvido" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Unidade de concentração" }), {
      target: { value: "%" },
    });
    await user.click(screen.getByRole("button", { name: "Salvar correção" }));
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(submit).toHaveBeenCalledWith({
      nome: "Limpa vidros",
      tipo: "limpeza_geral",
      analiseFds: "reviewed-pdf",
      correcoesFds: [{ indice: 0, unidadeConcentracao: "%" }],
    });
    expect(analyzeFds).toHaveBeenCalledTimes(2);
  });

  it("locks dismissal during removal, preserves the PDF on failure, and unlocks retry", async () => {
    let rejectRemoval!: (reason: Error) => void;
    vi.mocked(discardFdsAnalysis).mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectRemoval = reject;
        }),
    );
    const { handle } = setup();
    const user = userEvent.setup();
    await select();
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    await user.click(await screen.findByRole("button", { name: "Substituir documento corrigido" }));
    await select();
    await user.click(screen.getByRole("button", { name: "Remover FDS" }));
    const dialog = await screen.findByRole("dialog", { name: "Remover a FDS selecionada?" });
    await user.click(within(dialog).getByRole("button", { name: "Remover arquivo" }));
    expect(handle.current?.isDiscarding()).toBe(true);
    expect(within(dialog).getByRole("button", { name: "Voltar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(dialog).toBeInTheDocument();
    await act(async () => rejectRemoval(new Error("Offline")));
    await waitFor(() => expect(handle.current?.isDiscarding()).toBe(false));
    expect(handle.current?.hasAnalysis()).toBe(true);
    await user.click(within(dialog).getByRole("button", { name: "Remover arquivo" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(handle.current?.hasAnalysis()).toBe(false);
    expect(screen.queryByText("seguranca.pdf")).not.toBeInTheDocument();
    expect(discardFdsAnalysis).toHaveBeenCalledTimes(2);
  });
});
