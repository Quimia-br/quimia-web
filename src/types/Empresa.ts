export interface Empresa {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  senha: string;
  fotoUrl: string;
}

export type EmpresaSummary = Pick<Empresa, "id" | "nome" | "email">;

export type UpdateEmpresa = Pick<Empresa, "nome" | "email" | "fotoUrl">;

export type EmpresaMe = Omit<Empresa, "senha">;
