import { useRef, useState, type SubmitEvent } from "react";
import axios from "axios";
import { z } from "zod";
import { useAuth } from "./use-auth";
import { useUpdateProfile } from "./use-update-profile";
import { useToast } from "./use-toast";
import { ProfilePhotoError } from "@/lib/profile-photo-error";
import { profileEditorSchema } from "@/lib/utils/validation-empresa";
import type { EmpresaMe, UpdateProfile } from "@/types/Empresa";

export const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;

function errorMessage(error: unknown): { email?: string; message: string } {
  if (error instanceof ProfilePhotoError) {
    const detail = errorMessage(error.cause);
    return {
      message: `${error.fieldsSaved ? "Nome/e-mail salvos. " : ""}${detail.message.replace("alterar o perfil", "enviar a foto")}`,
    };
  }
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    if (error.response?.status === 401) {
      return {
        message: "Não foi possível autenticar sua sessão. Entre novamente e tente outra vez.",
      };
    }
    if (error.code === "ERR_BAD_RESPONSE" && error.response?.status === 200) {
      return {
        message: "Não foi possível confirmar o envio da foto. Tente novamente mais tarde.",
      };
    }
    const code = error.response?.data?.detail;
    if (code === "email_in_use")
      return {
        email: "Este e-mail já está em uso.",
        message: "Confira o e-mail informado.",
      };
    if (error.response?.status === 415 && code !== "imagem_invalida") {
      return {
        message:
          "O envio de foto ainda não está disponível. Tente novamente mais tarde ou descarte a nova foto para salvar os demais dados.",
      };
    }
    const messages: Record<string, string> = {
      imagem_invalida: "Escolha uma imagem JPEG, PNG ou WebP válida.",
      imagem_muito_grande: "A imagem deve ter no máximo 5 MB.",
      armazenamento_imagem_falhou: "Não foi possível enviar a foto. Tente novamente.",
      armazenamento_imagem_indisponivel:
        "O envio de fotos está indisponível. Tente novamente mais tarde ou descarte a nova foto.",
    };
    if (code && messages[code]) return { message: messages[code] };
  }
  return {
    message: "Não foi possível alterar o perfil. Verifique sua conexão e tente novamente.",
  };
}

export function useProfileEditorDialog(profile: EmpresaMe) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { sessionVersion } = useAuth();
  return {
    open,
    formKey: `${profile.id}:${sessionVersion}`,
    onOpenChange(next: boolean) {
      if (!saving) setOpen(next);
    },
    onSavingChange: setSaving,
    close() {
      setOpen(false);
    },
    onSaved() {
      toast.add({ type: "success", title: "Perfil alterado com sucesso" });
      setOpen(false);
    },
  };
}

interface ProfileEditorOptions {
  profile: EmpresaMe;
  onSavingChange: (saving: boolean) => void;
  onSaved: () => void;
}

export function useProfileEditor({ profile, onSavingChange, onSaved }: ProfileEditorOptions) {
  const saving = useRef(false);
  const [values, setValues] = useState({
    nome: profile.nome,
    email: profile.email,
  });
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string>();
  const [touched, setTouched] = useState({ nome: false, email: false });
  const mutation = useUpdateProfile();
  const toast = useToast();
  const parsed = profileEditorSchema.safeParse(values);
  const fieldsErrors = parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors;
  // Keep the concise label already used by this form; domain limits come from the shared schema.
  const emailFormatError =
    !parsed.success &&
    parsed.error.issues.some(
      (issue) => issue.path[0] === "email" && issue.code === "invalid_format",
    );
  const failure = mutation.isError ? errorMessage(mutation.error) : null;
  const normalizedEmail = values.email.trim().toLowerCase();
  const dirty =
    values.nome.trim() !== profile.nome ||
    normalizedEmail !== profile.email.toLowerCase() ||
    Boolean(image);
  const busy = mutation.isPending;

  function change(field: "nome" | "email", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    mutation.reset();
  }
  function blur(field: "nome" | "email") {
    setTouched((current) => ({ ...current, [field]: true }));
  }
  function changeImage(file: File | null) {
    if (file && file.size > PROFILE_IMAGE_MAX_SIZE) {
      setImageError("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setImageError(undefined);
    setImage(file);
    mutation.reset();
  }
  function discardImage() {
    changeImage(null);
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.success || !dirty || saving.current || imageError) return;
    const changes: UpdateProfile = {};
    if (parsed.data.nome !== profile.nome) changes.nome = parsed.data.nome;
    if (parsed.data.email !== profile.email.toLowerCase()) changes.email = parsed.data.email;
    if (image) changes.imagem = image;
    saving.current = true;
    onSavingChange(true);
    mutation.mutate(changes, {
      onSuccess: () => {
        onSavingChange(false);
        onSaved();
      },
      onError: (error) => {
        if (axios.isCancel(error)) return;
        toast.add({
          type: "error",
          title: "Não foi possível alterar o perfil",
          description: errorMessage(error).message,
        });
      },
      onSettled: () => {
        saving.current = false;
        onSavingChange(false);
      },
    });
  }

  return {
    values,
    image,
    imageError,
    busy,
    canSubmit: dirty && parsed.success && !imageError && !busy,
    errors: {
      nome: touched.nome ? fieldsErrors?.nome?.[0] : undefined,
      email:
        failure?.email ??
        (touched.email
          ? emailFormatError
            ? "E-mail inválido"
            : fieldsErrors?.email?.[0]
          : undefined),
    },
    change,
    blur,
    changeImage,
    discardImage,
    submit,
  };
}
