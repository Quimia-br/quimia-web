export interface HomeSummary {
  produtosEmEstantes: number;
  misturas: {
    total: number; bemSucedidas: number; malSucedidas: number; naoAvaliadas: number;
    taxaSucesso: number | null;
  };
}
export type DauDay = {
  data: string; usuariosAtivos: number; variacaoUsuarios?: number | null;
  variacaoPct?: number | null; mediaGlobal?: number | null; media7d?: number | null;
  desvioPadrao?: number | null; zScore?: number | null;
}
export type RecommendationDay = { data: string; totalConsultas: number; usuariosDistintos: number; };
export interface TopProduct {
  idProduto: number; nomeProduto: string; nomeMarca?: string | null;
  totalConsultas: number; ranking: number;
}
export interface UserProfile { nivelAcesso: string; estado: string; totalUsuarios: number; }
export interface ReportSeries { rotulo: string; valor: number; }
export type ReportCard = {
  id: string; titulo: string; series: ReportSeries[];
} & ({ tipo: "numero"; valor: number } | { tipo: "rosca"; valor?: number | null });
export interface Statistics { cards: ReportCard[]; }
