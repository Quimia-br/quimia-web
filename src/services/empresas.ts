import { api } from "@/lib/api";
import type { UpdateEmpresa, EmpresaMe } from "@/types/Empresa";

const path = "/empresas"

export async function getMe() {
  const { data } = await api.get<EmpresaMe>(`${path}/me`)

  return data
}

export async function updateMe(profile: UpdateEmpresa) {
  const { data } = await api.patch<EmpresaMe>(`${path}/me`, profile)

  return data
}
