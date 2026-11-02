import type { Marca } from "./Marca";

export const PRODUCT_SEARCH_FIELDS = ["nome", "tipo", "codBarras"] as const;
export type ProductSearchField = (typeof PRODUCT_SEARCH_FIELDS)[number];

export interface Produto {
  id: number;
  nome: string;
  tipo: string | null;
  descricao: string | null;
  codBarras: string | null;
  fotoUrl: string | null;
  marca: Marca;
}

export interface ProdutoSearch {
  query?: string;
  fields?: readonly ProductSearchField[];
  tipo?: string;
  codBarras?: string;
  page?: number;
  size?: number;
}

export interface CadastroProdutoForm {
  nome: string;
  tipo: string;
  descricao?: string;
  codBarras?: string;
  imagem?: File;
  fds?: File;
  analiseFds?: string;
  correcoesFds?: FdsCorrection[];
}

export interface FdsCorrection {
  indice: number;
  unidadeConcentracao: string;
}

export interface FdsPending {
  secao: string;
  campo: string;
  motivo: string;
  descricao: string;
  composto: { indice: number; nome: string; casNumero: string | null } | null;
  corrigivel: boolean;
  evidencias: { secao: string; pagina: number | null; textoEvidencia: string }[];
}

export interface FdsAnalysis {
  analiseId: string;
  expiraEm: string;
  status: "processado" | "processado_com_pendencias";
  mensagem: string | null;
  pendencias: FdsPending[];
  compostos: {
    indice: number;
    nome: string;
    casNumero: string | null;
    concentracaoMin: number | null;
    concentracaoMax: number | null;
    unidadeConcentracao: string | null;
  }[];
}

export type AlteracaoProdutoForm = Partial<CadastroProdutoForm>;

export interface CadastroProdutoResponse {
  produto: Produto;
  situacao: Situacao;
}

type Situacao = "criado" | "vinculado" | "reativado";
