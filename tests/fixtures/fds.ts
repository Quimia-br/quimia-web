import type { FdsAnalysis } from "@/types/Produto";

export const registeredProduct = {
  id: 42,
  nome: "Limpa vidros",
  tipo: "limpeza_geral",
  descricao: null,
  codBarras: null,
  fotoUrl: null,
  marca: { id: 1, nome: "Quimia", logoUrl: null },
};

export const cleanAnalysis: FdsAnalysis = {
  analiseId: "analise-1",
  expiraEm: "2099-01-01T00:00:00Z",
  status: "processado",
  mensagem: null,
  pendencias: [],
  compostos: [],
};

export const pendingAnalysis: FdsAnalysis = {
  ...cleanAnalysis,
  status: "processado_com_pendencias",
  mensagem: "Informações ausentes, verifique o documento anexado",
  pendencias: [
    {
      secao: "03",
      campo: "unidade_concentracao",
      motivo: "informacao_ausente",
      descricao: "A unidade de concentração não está especificada.",
      composto: { indice: 0, nome: "Hipoclorito de Sódio", casNumero: "7681-52-9" },
      corrigivel: true,
      evidencias: [
        { secao: "03", pagina: 2, textoEvidencia: "Hipoclorito de Sódio 7681-52-9 2 – 2,5 NaClO" },
      ],
    },
  ],
  compostos: [
    {
      indice: 0,
      nome: "Hipoclorito de Sódio",
      casNumero: "7681-52-9",
      concentracaoMin: 2,
      concentracaoMax: 2.5,
      unidadeConcentracao: null,
    },
  ],
};
