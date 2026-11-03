import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import type { Statistics, TopProduct, UserProfile } from "@/types/Relatorios";
import TopProductsReport from "@/components/reports/TopProductsReport";
import UserProfileReport from "@/components/reports/UserProfileReport";
import MixtureSuccessReport from "@/components/reports/MixtureSuccessReport";

const reports = vi.hoisted(() => ({
  products: [] as TopProduct[],
  profiles: [] as UserProfile[],
  statistics: { cards: [] } as Statistics,
}));

vi.mock("@/hooks/use-company-reports", () => ({
  useTopProductsReport: () => ({ data: reports.products, isPending: false, isError: false }),
  useUserProfileReport: () => ({ data: reports.profiles, isPending: false, isError: false }),
  useStatisticsReport: () => ({ data: reports.statistics, isPending: false, isError: false }),
}));
vi.mock("@/components/evilcharts/charts/echarts-bar-chart", () => {
  const Part = () => null;
  return {
    EChartsBarChart: Object.assign(Part, { Bar: Part, XAxis: Part, Tooltip: Part }),
  };
});
vi.mock("@/components/evilcharts/charts/echarts-pie-chart", () => {
  const Part = () => null;
  return { EChartsPieChart: Object.assign(Part, { Pie: Part, Tooltip: Part }) };
});

beforeEach(() => {
  reports.products = [];
  reports.profiles = [];
  reports.statistics = { cards: [] };
});
afterEach(cleanup);

describe("report data row identity", () => {
  it("keeps product rows when their ranking, metrics and names change", () => {
    reports.products = [
      {
        idProduto: 7,
        nomeProduto: "Detergente",
        nomeMarca: "Quimia",
        ranking: 1,
        totalConsultas: 12,
      },
      { idProduto: 8, nomeProduto: "Sabão", nomeMarca: "Quimia", ranking: 2, totalConsultas: 9 },
    ];
    const { rerender } = render(<TopProductsReport />);
    fireEvent.click(screen.getByText("Ver dados"));
    const detergent = screen.getByText("Detergente").closest("tr");
    const soap = screen.getByText("Sabão").closest("tr");
    reports.products = [
      { ...reports.products[1], ranking: 1, totalConsultas: 20 },
      {
        ...reports.products[0],
        nomeProduto: "Detergente atualizado",
        ranking: 2,
        totalConsultas: 14,
      },
    ];
    rerender(<TopProductsReport />);
    expect(screen.getByText("Detergente atualizado").closest("tr")).toBe(detergent);
    expect(screen.getByText("Sabão").closest("tr")).toBe(soap);
    expect(detergent).toHaveTextContent("14");
    expect(soap).toHaveTextContent("20");
  });

  it("distinguishes profile rows by both state and access level", () => {
    reports.profiles = [
      { estado: "SP", nivelAcesso: "USUARIO", totalUsuarios: 3 },
      { estado: "SP", nivelAcesso: "EMPRESA", totalUsuarios: 2 },
      { estado: "RJ", nivelAcesso: "USUARIO", totalUsuarios: 1 },
    ];
    const { container, rerender } = render(<UserProfileReport />);
    fireEvent.click(screen.getByText("Ver dados"));
    const originalRows = Array.from(container.querySelectorAll("tbody tr"));
    reports.profiles = [
      { ...reports.profiles[2], totalUsuarios: 7 },
      { ...reports.profiles[0], totalUsuarios: 8 },
      { ...reports.profiles[1], totalUsuarios: 9 },
    ];
    rerender(<UserProfileReport />);
    const updatedRows = Array.from(container.querySelectorAll("tbody tr"));
    expect(updatedRows[0]).toBe(originalRows[2]);
    expect(updatedRows[1]).toBe(originalRows[0]);
    expect(updatedRows[2]).toBe(originalRows[1]);
    expect(updatedRows[0]).toHaveTextContent("7");
  });
});

describe("mixture success card selection", () => {
  it("uses the doughnut card when a number card has the same id", () => {
    reports.statistics = {
      cards: [
        { id: "taxa_sucesso_misturas", titulo: "Total", tipo: "numero", valor: 100, series: [] },
        {
          id: "taxa_sucesso_misturas",
          titulo: "Taxa",
          tipo: "rosca",
          series: [
            { rotulo: "Bem sucedida", valor: 3 },
            { rotulo: "Mal sucedida", valor: 1 },
          ],
        },
      ],
    };
    render(<MixtureSuccessReport />);
    expect(screen.getByText("Taxa de sucesso: 75% em 4 misturas avaliadas.")).toBeInTheDocument();
  });

  it("shows the empty report when no matching doughnut card exists", () => {
    reports.statistics = {
      cards: [
        { id: "taxa_sucesso_misturas", titulo: "Total", tipo: "numero", valor: 100, series: [] },
      ],
    };
    render(<MixtureSuccessReport />);
    expect(screen.getByText("Ainda não há dados para este relatório.")).toBeInTheDocument();
  });
});
