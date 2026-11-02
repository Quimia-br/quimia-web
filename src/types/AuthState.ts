import type { EmpresaSummary } from "./Empresa";

export interface AuthState {
  accessToken: string | null;
  user: EmpresaSummary | null;
  isAuthenticated: boolean;
  sessionVersion: number;
  canRefresh: boolean;
  actions: {
    login: (token: string, user: EmpresaSummary) => void;
    refresh: (token: string, user: EmpresaSummary) => void;
    logout: () => void;
    setAccessToken: (token: string | null) => void;
    updateUser: (user: EmpresaSummary) => void;
  };
}

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  empresa: EmpresaSummary;
}

export interface RegisterRequest extends LoginCredentials {
  nome: string;
  cnpj: string;
}

export interface ResetPasswordData {
  resetToken: string;
  novaSenha: string;
}
