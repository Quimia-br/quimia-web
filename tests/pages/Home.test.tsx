import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { api } from "@/lib/api";
import { ThemeProvider } from "@/lib/theme-provider";
import Home from "@/pages/Home";
import type { HomeSummary } from "@/services/relatorios";

vi.mock("@/components/evilcharts/charts/echarts-pie-chart", () => {
  const Part = () => null;
  return {
    EChartsPieChart: Object.assign(() => <div data-testid="mixture-chart" />, {
      Pie: Part,
      Tooltip: Part,
    }),
  };
});

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
let summary: HomeSummary = {
  produtosEmEstantes: 128,
  misturas: { total: 40, bemSucedidas: 30, malSucedidas: 6, naoAvaliadas: 4, taxaSucesso: 0.8333 },
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  return render(
    <QueryClientProvider client={client}>
      <ThemeProvider defaultTheme="light" storageKey="home-test">
        <Home />
      </ThemeProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
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
  }));
  api.defaults.adapter = async (config) => ({
    config,
    data: summary,
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
});

afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Home", () => {
  it("mostra os três indicadores reais e não apresenta consultas como vendas", async () => {
    setup();
    expect(await screen.findByLabelText("128 produtos em estantes")).toBeInTheDocument();
    expect(screen.getByLabelText("40 misturas no total")).toBeInTheDocument();
    expect(screen.getByText(/83,3% de sucesso em 36 misturas avaliadas/)).toBeInTheDocument();
    expect(screen.getByText(/4 misturas ainda não avaliadas/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Produtos mais vendidos" })).toBeInTheDocument();
    expect(screen.getByText(/dados de vendas ainda não estão disponíveis/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar produto" })).toBeInTheDocument();
  });

  it("distingue zero de taxa de sucesso sem avaliações", async () => {
    const previous = summary;
    summary = {
      produtosEmEstantes: 0,
      misturas: { total: 0, bemSucedidas: 0, malSucedidas: 0, naoAvaliadas: 0, taxaSucesso: null },
    };
    setup();
    expect(await screen.findByLabelText("0 produtos em estantes")).toBeInTheDocument();
    expect(screen.getByLabelText("0 misturas no total")).toBeInTheDocument();
    expect(screen.getByText("Ainda não há misturas avaliadas.")).toBeInTheDocument();
    expect(screen.queryByTestId("mixture-chart")).not.toBeInTheDocument();
    summary = previous;
  });

  it("mantém o cadastro acessível quando os indicadores falham e permite recarregar", async () => {
    let fail = true;
    api.defaults.adapter = async (config) => {
      const response = {
        config,
        data: summary,
        status: fail ? 403 : 200,
        statusText: "",
        headers: new AxiosHeaders(),
      };
      if (fail) throw new AxiosError("forbidden", "403", config, undefined, response);
      return response;
    };
    setup();
    expect(
      await screen.findByText("Os indicadores não estão disponíveis para esta conta."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar produto" })).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByLabelText("128 produtos em estantes")).toBeInTheDocument();
  });
});
