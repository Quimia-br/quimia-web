import { useQuery } from "@tanstack/react-query"
import { getMe } from "@/services/auth"

export const authKeys = {
  all: ["auth"] as const,
  user: () => [...authKeys.all, "user"] as const,
}

export function useUser() {
  return useQuery({
    queryKey: authKeys.user(),
    queryFn: getMe,
    retry: false,
  })
}
