import { useRef, useState, type SubmitEvent } from "react";
import axios from "axios";
import { LoaderCircle, Pencil, X } from "lucide-react";
import { z } from "zod";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/lib/auth-token";
import { ProfilePhotoError } from "@/lib/profile-photo-error";
import type { EmpresaMe, UpdateProfile } from "@/types/Empresa";
import { ImageContainer } from "./ImageContainer";
import BasicButton from "./BasicButton";
import TextField from "./TextField";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { FieldGroup } from "./ui/field";
import { ScrollArea } from "./ui/scroll-area";
import { ToastProvider, ToastViewport } from "./Toast";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const profileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(255, "Use no máximo 255 caracteres."),
  email: z.email("E-mail inválido").max(255, "Use no máximo 255 caracteres."),
});

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
      return { message: "Não foi possível confirmar o envio da foto. Tente novamente mais tarde." };
    }
    const code = error.response?.data?.detail;
    if (code === "email_in_use")
      return { email: "Este e-mail já está em uso.", message: "Confira o e-mail informado." };
    if (error.response?.status === 415 && code !== "imagem_invalida")
      return {
        message:
          "O envio de foto ainda não está disponível. Tente novamente mais tarde ou descarte a nova foto para salvar os demais dados.",
      };
    const messages: Record<string, string> = {
      imagem_invalida: "Escolha uma imagem JPEG, PNG ou WebP válida.",
      imagem_muito_grande: "A imagem deve ter no máximo 5 MB.",
      armazenamento_imagem_falhou: "Não foi possível enviar a foto. Tente novamente.",
      armazenamento_imagem_indisponivel:
        "O envio de fotos está indisponível. Tente novamente mais tarde ou descarte a nova foto.",
    };
    if (code && messages[code]) return { message: messages[code] };
  }
  return { message: "Não foi possível alterar o perfil. Verifique sua conexão e tente novamente." };
}

function ProfileEditDialog({ profile }: { profile: EmpresaMe }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const session = useAuthStore((state) => state.sessionVersion);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) setOpen(next);
      }}
    >
      <DialogTrigger render={<BasicButton variant="secondary" icon={<Pencil />} />}>
        Editar
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="profile-edit-dialog flex max-h-[calc(100dvh-2rem)] w-[841px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-[40px] bg-surface-background p-0 ring-0 sm:max-w-[calc(100%-2rem)] sm:rounded-[60px]"
      >
        <ScrollArea
          role="region"
          aria-label="Conteúdo da edição do perfil"
          maskHeight={0}
          className="min-h-0 rounded-[inherit]"
          viewportClassName="max-h-[calc(100dvh-2rem)] overscroll-contain p-6 sm:px-[60px] sm:py-[50px] [&>div]:block!"
        >
          {open && (
            <ToastProvider key={`${profile.id}:${session}`}>
              <ProfileEditForm
                profile={profile}
                onSavingChange={setSaving}
                close={() => setOpen(false)}
                onSaved={() => {
                  toast.add({ type: "success", title: "Perfil alterado com sucesso" });
                  setOpen(false);
                }}
              />
            </ToastProvider>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ProfileEditForm({
  profile,
  onSavingChange,
  close,
  onSaved,
}: {
  profile: EmpresaMe;
  onSavingChange: (saving: boolean) => void;
  close: () => void;
  onSaved: () => void;
}) {
  const saving = useRef(false);
  const [values, setValues] = useState({ nome: profile.nome, email: profile.email });
  const [image, setImage] = useState<File | null>(null);
  const [imageError, setImageError] = useState<string>();
  const [touched, setTouched] = useState({ nome: false, email: false });
  const mutation = useUpdateProfile();
  const toast = useToast();
  const parsed = profileSchema.safeParse({ nome: values.nome, email: values.email.trim() });
  const fieldsErrors = parsed.success ? undefined : z.flattenError(parsed.error).fieldErrors;
  const failure = mutation.isError ? errorMessage(mutation.error) : null;
  const normalizedEmail = values.email.trim().toLowerCase();
  const dirty =
    values.nome.trim() !== profile.nome ||
    normalizedEmail !== profile.email.toLowerCase() ||
    !!image;
  const busy = mutation.isPending;

  function change(field: "nome" | "email", value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    mutation.reset();
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!parsed.success || !dirty || saving.current || imageError) return;
    const changes: UpdateProfile = {};
    if (parsed.data.nome !== profile.nome) changes.nome = parsed.data.nome;
    if (normalizedEmail !== profile.email.toLowerCase()) changes.email = normalizedEmail;
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

  return (
    <form onSubmit={submit} noValidate aria-busy={busy} className="flex min-h-0 flex-col gap-3.5">
      <DialogHeader className="relative min-w-0 gap-4 py-6 pr-[82px] [overflow-wrap:anywhere]">
        <DialogTitle className="text-2xl leading-tight sm:text-[2rem]">
          Alterar informações do perfil
        </DialogTitle>
        <DialogDescription className="text-xl leading-tight">
          Altere as informações do seu perfil abaixo
        </DialogDescription>
        <DialogClose
          disabled={busy}
          aria-label="Fechar edição de perfil"
          render={
            <Button
              variant="onColor"
              size="icon-md"
              className="absolute right-0 top-0 size-[70px] rounded-full"
            />
          }
        >
          <X aria-hidden="true" />
        </DialogClose>
      </DialogHeader>
      <ToastViewport label="Avisos de edição do perfil" />
      <div className="profile-edit-fields grid min-w-0 items-start gap-8 py-6">
        <div className="flex min-w-0 flex-col items-center gap-3">
          <ImageContainer
            shape="circle"
            label="Foto do perfil"
            className="w-[246px] max-w-full"
            value={image ?? profile.fotoUrl}
            maxFileSize={MAX_IMAGE_SIZE}
            error={imageError}
            disabled={busy}
            onChange={(file) => {
              if (file && file.size > MAX_IMAGE_SIZE) {
                setImageError("A imagem deve ter no máximo 5 MB.");
                return;
              }
              setImageError(undefined);
              setImage(file);
              mutation.reset();
            }}
          />
          {image && (
            <Button
              variant="link"
              disabled={busy}
              onClick={() => {
                setImage(null);
                setImageError(undefined);
                mutation.reset();
              }}
            >
              Descartar nova foto
            </Button>
          )}
        </div>
        <FieldGroup className="min-w-0 gap-8">
          <TextField
            label="Nome"
            name="nome"
            autoComplete="organization"
            value={values.nome}
            maxLength={255}
            disabled={busy}
            clearLabel="Limpar nome"
            onClear={() => change("nome", "")}
            onChange={(event) => change("nome", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, nome: true }))}
            error={touched.nome ? fieldsErrors?.nome?.[0] : undefined}
            className="min-h-18 h-auto [&_input]:text-base"
          />
          <TextField
            label="E-mail vinculado"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            maxLength={255}
            disabled={busy}
            clearLabel="Limpar e-mail"
            onClear={() => change("email", "")}
            onChange={(event) => change("email", event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, email: true }))}
            error={failure?.email ?? (touched.email ? fieldsErrors?.email?.[0] : undefined)}
            className="min-h-18 h-auto [&_input]:text-base"
          />
        </FieldGroup>
      </div>
      <div className="flex flex-wrap gap-2.5 pt-3 [&>button]:flex-1">
        <BasicButton variant="secondary" disabled={busy} onClick={close}>
          Cancelar
        </BasicButton>
        <BasicButton
          type="submit"
          disabled={!dirty || !parsed.success || !!imageError || busy}
          icon={busy ? <LoaderCircle className="animate-spin" /> : undefined}
        >
          {busy ? "Alterando…" : "Alterar"}
        </BasicButton>
      </div>
    </form>
  );
}
export default ProfileEditDialog;
