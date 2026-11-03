import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosHeaders } from "axios";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { ThemeProvider } from "@/lib/theme-provider";
import { api } from "@/lib/api";
import Graphs from "@/pages/Graphs";

vi.mock("@/components/evilcharts/charts/echarts-line-chart", () => {
  const Part = () => null;
  return {
    EChartsLineChart: Object.assign(() => <div data-testid="line-chart" />, {
      Line: Part,
      Dot: Part,
      ActiveDot: Part,
      XAxis: Part,
      YAxis: Part,
      Tooltip: Part,
      Legend: Part,
    }),
  };
});
vi.mock("@/components/evilcharts/charts/echarts-bar-chart", () => {
  const Part = () => null;
  return {
    EChartsBarChart: Object.assign(() => <div data-testid="bar-chart" />, {
      Bar: Part,
      XAxis: Part,
      Tooltip: Part,
    }),
  };
});
vi.mock("@/components/evilcharts/charts/echarts-pie-chart", () => {
  const Part = () => null;
  return {
    EChartsPieChart: Object.assign(() => <div data-testid="pie-chart" />, {
      Pie: Part,
      Tooltip: Part,
    }),
  };
});

const originalAdapter = api.defaults.adapter;
const clients: QueryClient[] = [];
const routers: ReturnType<typeof createBrowserRouter>[] = [];
const fixtures: Record<string, unknown> = {
  dau: [{ data: "2026-10-28", usuariosAtivos: 3 }],
  recomendacoes: [{ data: "2026-10-28", totalConsultas: 12, usuariosDistintos: 3 }],
  "top-produtos": [
    {
      idProduto: 7,
      nomeProduto: "Detergente",
      nomeMarca: "Quimia",
      ranking: 1,
      totalConsultas: 12,
    },
  ],
  "perfil-usuarios": [{ nivelAcesso: "USUARIO", estado: "SP", totalUsuarios: 3 }],
  estatisticas: {
    cards: [
      {
        id: "produtos_em_estantes",
        titulo: "Produtos em estantes",
        tipo: "numero",
        valor: 0,
        series: [],
      },
      {
        id: "taxa_sucesso_misturas",
        titulo: "Taxa de sucesso das misturas",
        tipo: "rosca",
        series: [
          { rotulo: "Bem sucedida", valor: 3 },
          { rotulo: "Mal sucedida", valor: 1 },
        ],
      },
    ],
  },
};

function setup(search = "") {
  window.history.replaceState({}, "", `/graphs${search}`);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  const router = createBrowserRouter([
    {
      path: "*",
      element: (
        <QueryClientProvider client={client}>
          <NuqsAdapter>
            <ThemeProvider defaultTheme="light" storageKey="graphs-test">
              <Graphs />
            </ThemeProvider>
          </NuqsAdapter>
        </QueryClientProvider>
      ),
    },
  ]);
  routers.push(router);
  return render(<RouterProvider router={router} />);
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
    data: fixtures[config.url!.split("/").at(-1)!],
    status: 200,
    statusText: "OK",
    headers: new AxiosHeaders(),
  });
});
afterEach(() => {
  cleanup();
  routers.splice(0).forEach((router) => router.dispose());
  clients.splice(0).forEach((client) => client.clear());
  api.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("dashboard de estatísticas", () => {
  it("compõe relatórios independentes e mostra dados consultáveis por teclado", async () => {
    setup();
    expect(
      await screen.findByRole("heading", { name: "Produtos mais consultados" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Taxa de sucesso: 75% em 4 misturas avaliadas."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("0 produtos em estantes")).toHaveTextContent("0");
    fireEvent.click(screen.getAllByText("Ver dados")[0]);
    expect(screen.getByRole("table", { name: "Usuários ativos por dia" })).toHaveTextContent(
      "28/10/2026",
    );
    expect(screen.getByText("Ainda sem base para comparar os dias.")).toBeInTheDocument();
  });

  it("mantém os outros relatórios quando um endpoint falha e permite tentar novamente", async () => {
    let fail = true;
    api.defaults.adapter = async (config) => {
      if (fail && config.url?.endsWith("/dau")) throw new Error("offline");
      return {
        config,
        data: fixtures[config.url!.split("/").at(-1)!],
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    };
    setup();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível carregar este relatório",
    );
    expect(
      await screen.findByRole("heading", { name: "Consultas aos produtos" }),
    ).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("respeita busca e filtro da URL, mostra ausência de resultados e limpa filtros", async () => {
    setup("?q=USUARIOS&tipo=barras");
    expect(await screen.findByRole("heading", { name: "Perfil dos usuários" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Usuários ativos" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filtros de estatísticas" }));
    fireEvent.click(screen.getByRole("button", { name: "Roscas" }));
    expect(
      await screen.findByRole("heading", { name: "Nenhum relatório encontrado" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(
      await screen.findByRole("heading", { name: "Produtos em estantes" }),
    ).toBeInTheDocument();
  });

  it("não desenha taxa fictícia para misturas sem avaliações", async () => {
    api.defaults.adapter = async (config) => ({
      config,
      data: config.url?.endsWith("estatisticas")
        ? {
            cards: [
              {
                id: "taxa_sucesso_misturas",
                titulo: "Taxa",
                tipo: "rosca",
                series: [
                  { rotulo: "Bem sucedida", valor: 0 },
                  { rotulo: "Mal sucedida", valor: 0 },
                ],
              },
            ],
          }
        : [],
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    setup();
    expect(await screen.findByText("Ainda não há misturas avaliadas.")).toBeInTheDocument();
    expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ainda não há dados para este relatório.").length).toBeGreaterThan(
      0,
    );
  });
});
