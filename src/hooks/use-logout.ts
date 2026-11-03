import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "@/services/auth";
import { authKeys } from "./use-user";

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => {
      const request = logout();
      void queryClient.cancelQueries({ queryKey: authKeys.all });
      queryClient.removeQueries({
        queryKey: authKeys.all,
      });
      return request;
    },
  });
}
