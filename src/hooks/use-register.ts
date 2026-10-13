import { useMutation } from "@tanstack/react-query"
import { register } from "@/services/auth"

export function useRegister() {
  return useMutation({
    mutationFn: register,
  })
}
