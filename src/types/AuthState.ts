import type { Empresa, EmpresaSummary } from "./Empresa";

export interface AuthState {
  accessToken: string | null;
  user: EmpresaSummary | null;
  isAuthenticated: boolean;
  actions: {
    login: (token: string, user: EmpresaSummary) => void;
    logout: () => void;
    setAccessToken: (token: string | null) => void;
  };
}

export type LoginCredentials = Pick<Empresa, "email" | "senha">;

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  empresa: EmpresaSummary;
}

export type RegisterRequest = Pick<
  Empresa,
  "nome" | "cnpj" | "email" | "senha"
>;

export interface ResetPasswordData {
  resetToken: string;
  novaSenha: string;
}
