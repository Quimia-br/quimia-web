import BasicButton from "@/components/BasicButton";
import FormTextField from "@/components/FormTextField";
import MainTitle from "@/components/MainTitle";
import LinkButton from "@/components/LinkButton";
import Form from "@/components/smoothui/form";
import RecoveryEmailSent from "@/components/RecoveryEmailSent";
import { useForgotPasswordForm } from "@/hooks/use-forgot-password-form";

interface ForgotPasswordFormProps {
  onError: () => void;
}

export default function ForgotPasswordForm({ onError }: ForgotPasswordFormProps) {
  const { form, errors, pending, sentTo, handleSubmit, submitDisabled, limits } =
    useForgotPasswordForm(onError);

  if (sentTo) return <RecoveryEmailSent email={sentTo} />;

  return (
    <>
      <MainTitle
        title="Esqueceu a senha?"
        description="Digite o e-mail atrelado à conta da sua empresa para resetar sua senha."
      />
      <Form errors={errors} onFormSubmit={handleSubmit}>
        <form.Field name="email">
          {(field) => (
            <FormTextField
              name={field.name}
              label="E-mail"
              type="email"
              maxLength={limits.email}
              autoComplete="email"
              clearLabel="Limpar e-mail"
              placeholder="email.exemplo@quimia.com"
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
            {pending ? "Enviando..." : "Enviar e-mail"}
          </BasicButton>
          <LinkButton to="/login">Cancelar</LinkButton>
        </div>
      </Form>
    </>
  );
}
