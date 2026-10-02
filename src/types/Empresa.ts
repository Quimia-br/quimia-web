export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  email: string;
  senha: string;
  fotoUrl: string;
}

export type EmpresaSummary = Pick<Empresa, "id" | "nome" | "email">;

export type UpdateEmpresa = Pick<Empresa, "nome" | "email" | "fotoUrl">;

export type EmpresaMe = Omit<Empresa, "senha">;

export type LoginCredentials = Pick<Empresa, "email" | "senha">;

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: EmpresaSummary;
}

export type RegisterRequest = Pick<
  Empresa,
  "nome" | "cnpj" | "email" | "senha"
>;
