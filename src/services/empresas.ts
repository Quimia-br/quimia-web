import { api, restoreAccessToken } from "@/services/api";
import type { UpdateEmpresa, EmpresaMe, UpdateProfile } from "@/types/Empresa";
import { z } from "zod";
import { validateUpdateEmpresa } from "@/lib/utils/validation-empresa";
import { validateImage } from "@/lib/utils/validation-files";
import { normalizeServiceError, parseResponse } from "./errors";

const path = "/empresas";
const profileResponseSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().trim().min(1),
  email: z.email(),
  cnpj: z.string(),
  fotoUrl: z.string().nullable(),
  ativo: z.boolean(),
});
const photoResponseSchema = z.object({
  fotoUrl: z.url({ protocol: /^https$/ }),
});

export async function getMe(signal?: AbortSignal): Promise<EmpresaMe> {
  try {
    const restoring = signal?.aborted ? undefined : restoreAccessToken();
    if (restoring) await restoring;
    const response = await api.get<EmpresaMe>(`${path}/me`, {
      signal,
      // Bypass old HTTP 200 error pages without requiring another CORS header.
      params: { _profile: Date.now() },
    });
    return parseResponse(response, profileResponseSchema, "invalid_profile_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "empresas.getMe");
  }
}

export async function updateMe(profile: UpdateEmpresa): Promise<EmpresaMe> {
  try {
    const response = await api.patch<unknown>(`${path}/me`, validateUpdateEmpresa(profile));
    return parseResponse(response, profileResponseSchema, "invalid_profile_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "empresas.updateMe");
  }
}

export async function updateProfile(
  profile: Pick<UpdateProfile, "nome" | "email">,
): Promise<EmpresaMe> {
  return updateMe(profile);
}

export async function uploadProfilePhoto(image: File): Promise<{ fotoUrl: string }> {
  try {
    const form = new FormData();
    form.append("imagem", await validateImage(image));
    const response = await api.post<unknown>(`${path}/me/foto`, form, {
      headers: { "Content-Type": undefined },
    });
    return parseResponse(response, photoResponseSchema, "invalid_profile_photo_response");
  } catch (cause) {
    throw normalizeServiceError(cause, "empresas.uploadProfilePhoto");
  }
}
