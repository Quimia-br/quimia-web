import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import type { EmpresaSummary, LoginCredentials, LoginResponse, RegisterRequest } from "@/types/Empresa";

const path = "/empresas/auth"

export async function register(credentials: RegisterRequest) {
  const { data } = await api.post<EmpresaSummary>(
    `${path}/register`,
    credentials,
  )

  return data
}

export async function login(credentials: LoginCredentials) {
  const { data } = await api.post<LoginResponse>(
    `${path}/login`,
    credentials,
  )

  useAuthStore.setState({
    accessToken: data.accessToken,
    user: data.user,
    isAuthenticated: true
  });

  return data.user
}

export async function logout() {
  try {
    await api.post(`${path}/logout`)
  } finally {
    useAuthStore.setState({
      accessToken: null,
      user: null,
      isAuthenticated: false
    });
  }
}
