import { api, restoreAccessToken } from "@/lib/api";
import type { UpdateEmpresa, EmpresaMe, UpdateProfile } from "@/types/Empresa";
import { AxiosError } from "axios";
import { z } from "zod";

const path = "/empresas";
const profileResponseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().trim().min(1),
  email: z.email(),
});
const photoResponseSchema = z.object({ fotoUrl: z.url({ protocol: /^https$/ }) });

export async function getMe(signal?: AbortSignal) {
  const restoring = signal?.aborted ? undefined : restoreAccessToken();
  if (restoring) await restoring;
  const response = await api.get<EmpresaMe>(`${path}/me`, {
    signal,
    // Bypass old HTTP 200 error pages without requiring another CORS header.
    params: { _profile: Date.now() },
  });
  const { data } = response;
  if (!profileResponseSchema.safeParse(data).success) {
    throw new AxiosError(
      "invalid_profile_response",
      AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response,
    );
  }

  return data;
}

export async function updateMe(profile: UpdateEmpresa) {
  const { data } = await api.patch<EmpresaMe>(`${path}/me`, profile);

  return data;
}

export async function updateProfile(profile: Pick<UpdateProfile, "nome" | "email">) {
  return updateMe(profile);
}

export async function uploadProfilePhoto(image: File) {
  const form = new FormData();
  form.append("imagem", image);
  const response = await api.post<unknown>(`${path}/me/foto`, form, {
    headers: { "Content-Type": undefined },
  });
  const parsed = photoResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new AxiosError(
      "invalid_profile_photo_response",
      AxiosError.ERR_BAD_RESPONSE,
      response.config,
      response.request,
      response,
    );
  }
  return parsed.data;
}
