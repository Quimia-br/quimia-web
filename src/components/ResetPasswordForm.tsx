import BasicButton from "@/components/BasicButton";
import FormTextField from "@/components/FormTextField";
import MainTitle from "@/components/MainTitle";
import LinkButton from "@/components/LinkButton";
import Form from "@/components/smoothui/form";
import { useResetPasswordForm } from "@/hooks/use-reset-password-form";

interface ResetPasswordFormProps {
  token: string;
  onError: (invalid: boolean) => void;
}

export default function ResetPasswordForm({ token, onError }: ResetPasswordFormProps) {
  const { form, errors, pending, handleSubmit, submitDisabled, limits } = useResetPasswordForm(
    token,
    onError,
  );

  return (
    <>
      <MainTitle title="Resete a senha" description="Crie uma nova senha atrelada à sua conta" />
      <Form errors={errors} onFormSubmit={handleSubmit}>
        <form.Field name="password">
          {(field) => (
            <FormTextField
              name={field.name}
              label="Criar senha"
              description="Use pelo menos 8 caracteres, uma letra e um número."
              type="password"
              maxLength={limits.password}
              autoComplete="new-password"
              placeholder="Sua nova senha"
              value={field.state.value}
              disabled={pending}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <form.Field name="confirmation">
          {(field) => (
            <FormTextField
              name={field.name}
              label="Confirmar sua senha"
              type="password"
              maxLength={limits.password}
              autoComplete="new-password"
              placeholder="Repita sua nova senha"
              value={field.state.value}
              disabled={pending}
              onChange={(event) => field.handleChange(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
        <div className="flex flex-col items-center gap-3">
          <BasicButton
            type="submit"
            className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
            disabled={submitDisabled}
          >
            {pending ? "Resetando..." : "Resetar senha"}
          </BasicButton>
          <LinkButton to="/login">Cancelar</LinkButton>
        </div>
      </Form>
    </>
  );
}
