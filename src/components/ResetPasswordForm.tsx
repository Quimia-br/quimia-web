import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import axios from "axios";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import BasicButton from "@/components/BasicButton";
import FormTextField from "@/components/FormTextField";
import MainTitle from "@/components/MainTitle";
import LinkButton from "@/components/LinkButton";
import Form from "@/components/smoothui/form";
import { resetPassword } from "@/services/auth";

const passwordMessage = "Use pelo menos 8 caracteres, uma letra e um número.";
const schema = z
  .object({
    password: z
      .string()
      .min(8, passwordMessage)
      .regex(/\p{L}/u, passwordMessage)
      .regex(/\p{Nd}/u, passwordMessage)
      .refine(
        (value) => new TextEncoder().encode(value).length <= 72,
        "A senha deve ter no máximo 72 bytes.",
      ),
    confirmation: z.string().nonempty("Confirme sua senha"),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem",
  });

export default function ResetPasswordForm({
  token,
  onError,
}: {
  token: string;
  onError: (invalid: boolean) => void;
}) {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: { password: "", confirmation: "" },
    validators: { onDynamic: schema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      try {
        await resetPassword({ resetToken: token, novaSenha: value.password });
        navigate("/reset-password/success", { replace: true, state: { passwordReset: true } });
      } catch (error) {
        const detail = axios.isAxiosError<{ detail?: string }>(error)
          ? error.response?.data?.detail
          : undefined;
        if (detail === "weak_password" || detail === "password_too_long") {
          form.setFieldMeta("password", (meta) => ({
            ...meta,
            errorMap: {
              ...meta.errorMap,
              onSubmit:
                detail === "weak_password"
                  ? "Escolha uma senha menos comum. " + passwordMessage
                  : "A senha deve ter no máximo 72 bytes.",
            },
          }));
          return;
        }
        onError(detail === "invalid_reset_token");
      }
    },
  });
  const errors = useSelector(form.store, (state) =>
    Object.fromEntries(
      Object.entries(state.fieldMeta).map(([name, meta]) => {
        const issue = meta.errors[0];
        return [name, typeof issue === "string" ? issue : issue?.message];
      }),
    ),
  );
  const pending = useSelector(form.store, (state) => state.isSubmitting);

  return (
    <>
      <MainTitle title="Resete a senha" description="Crie uma nova senha atrelada à sua conta" />
      <Form
        errors={errors}
        onFormSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <form.Field name="password">
          {(field) => (
            <FormTextField
              name={field.name}
              label="Criar senha"
              description={passwordMessage}
              type="password"
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
          <form.Subscribe
            selector={(state) => !!state.values.password && !!state.values.confirmation}
          >
            {(complete) => (
              <BasicButton
                type="submit"
                className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
                disabled={!complete || pending}
              >
                {pending ? "Resetando..." : "Resetar senha"}
              </BasicButton>
            )}
          </form.Subscribe>
          <LinkButton to="/login">Cancelar</LinkButton>
        </div>
      </Form>
    </>
  );
}
