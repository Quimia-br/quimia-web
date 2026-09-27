import type { NivelAcesso } from "./NivelAcesso";

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  dataNasc: Date;
  nivelAcesso: NivelAcesso;
  ultimaSessao: Date;
}

export type UserSummary = Pick<User, "id" | "nome" | "email">

export type UserMe = Omit<User, "senha">

export type LoginCredentials = Pick<User, "email" | "senha">;

export interface LoginResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserSummary;
}
