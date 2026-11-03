import { createContext, useContext } from "react";
import type { EmpresaSummary } from "@/types/Empresa";

export interface AuthContextValue {
  user: EmpresaSummary | null;
  isAuthenticated: boolean;
  canRefresh: boolean;
  sessionVersion: number;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const session = useContext(AuthContext);
  if (!session) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return session;
}
