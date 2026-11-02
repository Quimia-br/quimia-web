import type { ReportSeries, UserProfile } from "@/services/relatorios";

export const reportNumber = new Intl.NumberFormat("pt-BR");
export const reportDecimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
export const reportPercent = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const normalize = (text: string) =>
  text.trim().normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("pt-BR");
export const matchesReport = (title: string, query: string) =>
  normalize(title).includes(normalize(query));
export const formatReportDate = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;
export const fullReportDate = (date: string) => `${formatReportDate(date)}/${date.slice(0, 4)}`;

export function aggregateUserStates(rows: UserProfile[]) {
  const states = new Map<string, number>();
  for (const row of rows) {
    const state = row.estado === "NI" ? "Não informado" : row.estado;
    states.set(state, (states.get(state) ?? 0) + row.totalUsuarios);
  }
  return Array.from(states, ([estado, totalUsuarios]) => ({ estado, totalUsuarios })).sort(
    (a, b) => b.totalUsuarios - a.totalUsuarios || a.estado.localeCompare(b.estado),
  );
}

export function getMixtureSuccess(series: ReportSeries[]) {
  const evaluated = series.reduce((sum, row) => sum + row.valor, 0);
  if (!evaluated) return null;
  const successful = series.find((row) => normalize(row.rotulo) === "bem sucedida")?.valor ?? 0;
  return successful / evaluated;
}
