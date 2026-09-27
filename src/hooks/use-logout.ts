import { useMutation, useQueryClient } from "@tanstack/react-query"
import { logout } from "../services/auth"
import { authKeys } from "./use-user"

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,

    onSuccess: () => {
      queryClient.setQueryData(authKeys.user(), null)
      queryClient.removeQueries({
        queryKey: authKeys.all,
      })
    },
  })
}
