import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "@/services/auth";
import { authKeys } from "@/hooks/use-user";
import { useAuthStore } from "@/lib/auth-token";
import type { LoginCredentials } from "@/types/AuthState";

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const sessionVersion = useAuthStore.getState().sessionVersion;
      const user = await login(credentials);
      // A successful login advances the version once; a later transition owns its cache.
      if (useAuthStore.getState().sessionVersion === sessionVersion + 1) {
        void queryClient.cancelQueries({ queryKey: authKeys.all });
        queryClient.removeQueries({ queryKey: authKeys.all });
      }
      return user;
    },
  });
}
