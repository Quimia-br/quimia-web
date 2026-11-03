import { describe, expect, it } from "vite-plus/test";
import {
  aggregateUserStates,
  formatReportDate,
  getMixtureSuccess,
  matchesReport,
} from "@/lib/company-reports";

describe("preparação dos relatórios", () => {
  it("agrupa níveis de acesso na mesma UF e preserva estado não informado", () => {
    expect(
      aggregateUserStates([
        { nivelAcesso: "A", estado: "SP", totalUsuarios: 3 },
        { nivelAcesso: "B", estado: "SP", totalUsuarios: 2 },
        { nivelAcesso: "A", estado: "NI", totalUsuarios: 1 },
      ]),
    ).toEqual([
      { estado: "SP", totalUsuarios: 5 },
      { estado: "Não informado", totalUsuarios: 1 },
    ]);
  });
  it("não apresenta taxa de sucesso sem misturas avaliadas", () => {
    expect(
      getMixtureSuccess([
        { rotulo: "Bem sucedida", valor: 0 },
        { rotulo: "Mal sucedida", valor: 0 },
      ]),
    ).toBeNull();
    expect(
      getMixtureSuccess([
        { rotulo: "Bem sucedida", valor: 3 },
        { rotulo: "Mal sucedida", valor: 1 },
      ]),
    ).toBe(0.75);
  });
  it("busca por título sem caixa ou acento e trata símbolos como texto", () => {
    expect(matchesReport("Usuários ativos", "USUARIOS")).toBe(true);
    expect(matchesReport("Taxa de sucesso", "%")).toBe(false);
  });
  it("formata a data sem deslocar o dia pelo fuso", () => {
    expect(formatReportDate("2026-10-28")).toBe("28/10");
  });
});
