import { useMutation, useQueryClient } from "@tanstack/react-query"
import { register } from "@/services/auth"
import { authKeys } from "@/hooks/use-user"

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: register,

    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.user(), user)
    },
  })
}
