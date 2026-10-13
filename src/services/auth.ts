import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-token";
import type { EmpresaSummary } from "@/types/Empresa";
import type { LoginCredentials, LoginResponse, RegisterRequest, ResetPasswordData } from "@/types/AuthState";

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

  useAuthStore.getState().actions.login(data.accessToken, data.empresa)

  return data.empresa
}

export async function logout() {
  try {
    await api.post(`${path}/logout`)
  } finally {
    useAuthStore.getState().actions.logout()
  }
}

export async function forgotPassword(email: string) {
  await api.post(`${path}/forgot-password`, { email });
}

export async function resetPassword({ resetToken, novaSenha }: ResetPasswordData) {
  await api.post(`${path}/reset-password`, { resetToken, novaSenha });
}
