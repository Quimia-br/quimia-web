import { useState } from "react";
import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import { z } from "zod";
import BasicButton from "@/components/BasicButton";
import FormTextField from "@/components/FormTextField";
import MainTitle from "@/components/MainTitle";
import LinkButton from "@/components/LinkButton";
import Form from "@/components/smoothui/form";
import RecoveryEmailSent from "@/components/RecoveryEmailSent";
import { forgotPassword } from "@/services/auth";

const schema = z.object({ email: z.email("Informe um e-mail válido") });

export default function ForgotPasswordForm({ onError }: { onError: () => void }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm({
    defaultValues: { email: "" },
    validators: { onDynamic: schema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      try {
        await forgotPassword(value.email.trim());
        setSentTo(value.email.trim());
      } catch {
        onError();
      }
    },
  });
  const errors = useSelector(form.store, (state) => ({
    email: state.fieldMeta.email?.errors[0]?.message,
  }));
  const pending = useSelector(form.store, (state) => state.isSubmitting);

  if (sentTo) return <RecoveryEmailSent email={sentTo} />;

  return (
    <>
      <MainTitle
        title="Esqueceu a senha?"
        description="Digite o e-mail atrelado à conta da sua empresa para resetar sua senha."
      />
      <Form
        errors={errors}
        onFormSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => (
            <FormTextField
              name={field.name}
              label="E-mail"
              type="email"
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
          <form.Subscribe selector={(state) => !!state.values.email.trim()}>
            {(hasEmail) => (
              <BasicButton
                type="submit"
                className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
                disabled={!hasEmail || pending}
              >
                {pending ? "Enviando..." : "Enviar e-mail"}
              </BasicButton>
            )}
          </form.Subscribe>
          <LinkButton to="/login">Cancelar</LinkButton>
        </div>
      </Form>
    </>
  );
}
