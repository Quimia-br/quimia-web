import { api } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/auth-token";
import type { LoginCredentials, LoginResponse, UserMe } from "@/types/User";

const path = "/api/v1/auth"

export async function login(credentials: LoginCredentials) {
  const { data } = await api.post<LoginResponse>(
    `${path}/login`,
    credentials,
  )

  setAccessToken(data.accessToken)

  return data.user
}

export async function getMe() {
  const { data } = await api.get<UserMe>(`${path}/me`)

  return data
}

export async function logout() {
  try {
    await api.post(`${path}/logout`)
  } finally {
    clearAccessToken()
  }
}
