import { LoaderCircle, Pencil, X } from "lucide-react";
import {
  PROFILE_IMAGE_MAX_SIZE,
  useProfileEditor,
  useProfileEditorDialog,
} from "@/hooks/use-profile-editor";
import type { EmpresaMe } from "@/types/Empresa";
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

interface ProfileEditDialogProps {
  profile: EmpresaMe;
}

interface ProfileEditFormProps {
  profile: EmpresaMe;
  onSavingChange: (saving: boolean) => void;
  close: () => void;
  onSaved: () => void;
}

function ProfileEditDialog({ profile }: ProfileEditDialogProps) {
  const editor = useProfileEditorDialog(profile);
  return (
    <Dialog open={editor.open} onOpenChange={editor.onOpenChange}>
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
          {editor.open && (
            <ToastProvider key={editor.formKey}>
              <ProfileEditForm
                profile={profile}
                onSavingChange={editor.onSavingChange}
                close={editor.close}
                onSaved={editor.onSaved}
              />
            </ToastProvider>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ProfileEditForm({ profile, onSavingChange, close, onSaved }: ProfileEditFormProps) {
  const {
    values,
    image,
    imageError,
    errors,
    busy,
    canSubmit,
    change,
    blur,
    changeImage,
    discardImage,
    submit,
  } = useProfileEditor({ profile, onSavingChange, onSaved });
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
            maxFileSize={PROFILE_IMAGE_MAX_SIZE}
            error={imageError}
            disabled={busy}
            onChange={changeImage}
          />
          {image && (
            <Button variant="link" disabled={busy} onClick={discardImage}>
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
            onBlur={() => blur("nome")}
            error={errors.nome}
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
            onBlur={() => blur("email")}
            error={errors.email}
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
          disabled={!canSubmit}
          icon={busy ? <LoaderCircle className="animate-spin" /> : undefined}
        >
          {busy ? "Alterando…" : "Alterar"}
        </BasicButton>
      </div>
    </form>
  );
}
export default ProfileEditDialog;
