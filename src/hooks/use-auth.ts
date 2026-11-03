import { createContext, useContext } from "react";
import type { EmpresaSummary } from "@/types/Empresa";

export interface AuthContextValue {
  user: EmpresaSummary | null;
  isAuthenticated: boolean;
  canRefresh: boolean;
  sessionVersion: number;
  isCurrentSession: (version: number) => boolean;
  isCurrentCompany: (companyId: number | null) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const session = useContext(AuthContext);
  if (!session) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return session;
}
