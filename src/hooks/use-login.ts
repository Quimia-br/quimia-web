import { useMutation, useQueryClient } from "@tanstack/react-query"
import { login } from "@/services/auth"
import { authKeys } from "@/hooks/use-user"

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: login,

    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user(), user)
    },
  })
}
