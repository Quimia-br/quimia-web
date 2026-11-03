export interface EmpresaSummary {
  id: number;
  nome: string;
  email: string;
}

export interface EmpresaMe extends EmpresaSummary {
  cnpj: string;
  fotoUrl: string | null;
  ativo: boolean;
}

export interface UpdateEmpresa {
  nome?: string;
  email?: string;
  fotoUrl?: string;
}

export interface UpdateProfile {
  nome?: string;
  email?: string;
  imagem?: File;
}
