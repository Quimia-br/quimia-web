import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/services/empresas";
import { useAuthStore } from "@/lib/auth-token";

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
};

export function useUser() {
  const canRefresh = useAuthStore((state) => state.canRefresh);
  return useQuery({
    enabled: canRefresh,
    queryKey: authKeys.user(),
    queryFn: ({ signal }) => getMe(signal),
    retry: false,
  });
}
