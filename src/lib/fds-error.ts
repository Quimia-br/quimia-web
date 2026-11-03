import axios from "axios";

export function fdsError(error: unknown): string | undefined {
  const messages: Record<string, string> = {
    pdf_muito_grande: "O PDF deve ter no máximo 10 MB. Escolha um arquivo menor.",
    pdf_invalido: "Escolha um PDF válido da Ficha de Dados de Segurança.",
    fds_invalida: "Não foi possível ler esta FDS. Envie um PDF com texto legível.",
    fds_obrigatoria: "Adicione o PDF da Ficha de Dados de Segurança para continuar.",
    fds_ausente: "Adicione o PDF da Ficha de Dados de Segurança para continuar.",
    analise_expirada: "A análise da FDS expirou. Analise o arquivo novamente para continuar.",
    analise_invalida:
      "Não foi possível usar esta análise. Analise o arquivo novamente para continuar.",
    analise_nao_encontrada:
      "A análise da FDS não foi encontrada ou expirou. Seu arquivo foi mantido; analise-o novamente.",
    analises_demais:
      "Há muitas FDS em análise neste momento. Seu arquivo foi mantido; tente novamente em instantes.",
    analise_falhou: "Não foi possível analisar a FDS. Seu arquivo foi mantido; tente novamente.",
    correcao_invalida:
      "Revise as unidades de concentração informadas. Só é possível preencher unidades ausentes.",
    empresa_nao_encontrada:
      "Não foi possível encontrar sua empresa. Entre novamente para continuar.",
    extrator_indisponivel:
      "A análise da FDS está indisponível. Seu arquivo foi mantido; tente novamente em instantes.",
    extrator_falhou: "Não foi possível analisar a FDS. Tente novamente ou substitua o documento.",
    armazenamento_fds_indisponivel:
      "O armazenamento da FDS está indisponível. Tente novamente em instantes.",
    armazenamento_fds_falhou:
      "Não foi possível guardar a FDS. Seu arquivo foi mantido; tente novamente.",
  };
  if (!axios.isAxiosError<{ detail?: string }>(error)) return undefined;
  if (error.message === "invalid_fds_analysis_response")
    return "O serviço retornou uma análise inválida. Seu arquivo foi mantido; tente novamente.";
  if (error.message === "fds_analysis_timeout")
    return "A análise da FDS demorou mais que o esperado. Seu arquivo foi mantido; tente novamente em instantes.";
  const message = messages[error.response?.data?.detail ?? ""];
  if (message) return message;
  if (error.response?.status === 404 || error.response?.status === 405) {
    return "A análise da FDS não está disponível nesta versão do serviço. Seu arquivo foi mantido; tente novamente após a atualização.";
  }
  return undefined;
}
