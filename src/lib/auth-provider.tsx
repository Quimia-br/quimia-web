import { useMemo, type ReactNode } from "react";
import { AuthContext } from "@/hooks/use-auth";
import { useAuthStore } from "@/lib/auth-token";

export interface AuthProviderProps {
  children: ReactNode;
}

const isCurrentSession = (version: number): boolean =>
  useAuthStore.getState().sessionVersion === version;
const isCurrentCompany = (companyId: number | null): boolean =>
  (useAuthStore.getState().user?.id ?? null) === companyId;

/** Session is shared by Context; transport credentials remain private to the HTTP client. */
export function AuthProvider({ children }: AuthProviderProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const canRefresh = useAuthStore((state) => state.canRefresh);
  const sessionVersion = useAuthStore((state) => state.sessionVersion);
  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      canRefresh,
      sessionVersion,
      isCurrentSession,
      isCurrentCompany,
    }),
    [user, isAuthenticated, canRefresh, sessionVersion],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
