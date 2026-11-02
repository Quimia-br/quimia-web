import type { ChartConfig } from "@/components/evilcharts/ui/echarts-chart";

const color = (label: string, token: string) => ({
  label,
  colors: { light: [`var(${token})`], dark: [`var(${token})`] },
});
export const dauConfig = {
  usuariosAtivos: color("Usuários ativos", "--brand-accent"),
  media7d: color("Média de 7 dias com consulta", "--chart-1"),
} satisfies ChartConfig;
export const recommendationsConfig = {
  totalConsultas: color("Consultas", "--brand-accent"),
  usuariosDistintos: color("Usuários distintos no dia", "--chart-1"),
} satisfies ChartConfig;
export const productsConfig = {
  totalConsultas: color("Consultas", "--brand-accent"),
} satisfies ChartConfig;
export const profileConfig = {
  totalUsuarios: color("Usuários", "--brand-accent"),
} satisfies ChartConfig;
export const mixturesConfig = {
  sucesso: color("Bem sucedida", "--brand-accent"),
  falha: color("Mal sucedida", "--chart-1"),
} satisfies ChartConfig;
