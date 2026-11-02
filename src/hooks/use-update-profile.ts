import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CanceledError, isCancel } from "axios";
import { useAuthStore } from "@/lib/auth-token";
import { getMe, updateProfile, uploadProfilePhoto } from "@/services/empresas";
import type { EmpresaMe, UpdateProfile } from "@/types/Empresa";
import { ProfilePhotoError } from "@/lib/profile-photo-error";
import { authKeys } from "./use-user";

export function useUpdateProfile() {
  const client = useQueryClient();
  return useMutation({
    retry: false,
    mutationFn: async (changes: UpdateProfile) => {
      const session = useAuthStore.getState().sessionVersion;
      function checkSession() {
        const current = useAuthStore.getState();
        if (current.sessionVersion !== session || !current.isAuthenticated)
          throw new CanceledError("A sessão mudou durante a edição do perfil.");
      }
      async function publish(profile: EmpresaMe) {
        checkSession();
        await client.cancelQueries({ queryKey: authKeys.user() });
        checkSession();
        client.setQueryData(authKeys.user(), profile);
        useAuthStore
          .getState()
          .actions.updateUser({ id: profile.id, nome: profile.nome, email: profile.email });
      }
      checkSession();
      let profile = client.getQueryData<EmpresaMe>(authKeys.user());
      let fieldsSaved = false;
      if (changes.nome !== undefined || changes.email !== undefined) {
        profile = await updateProfile({ nome: changes.nome, email: changes.email });
        await publish(profile);
        fieldsSaved = true;
      }
      if (!profile) {
        profile = await getMe();
        checkSession();
      }
      if (changes.imagem) {
        try {
          checkSession();
          const { fotoUrl } = await uploadProfilePhoto(changes.imagem);
          checkSession();
          profile = { ...(client.getQueryData<EmpresaMe>(authKeys.user()) ?? profile), fotoUrl };
          await publish(profile);
        } catch (error) {
          if (isCancel(error)) throw error;
          throw new ProfilePhotoError(error, fieldsSaved);
        }
      }
      return profile;
    },
  });
}
