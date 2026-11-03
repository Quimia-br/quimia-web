import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import axios from "axios";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "@/services/auth";
import { AUTH_FIELD_LIMITS, newPasswordSchema } from "@/utils/validation-auth";
import type { SyntheticEvent } from "react";

const passwordMessage = "Use pelo menos 8 caracteres, uma letra e um número.";
const schema = z
  .object({
    password: newPasswordSchema,
    confirmation: z.string().nonempty("Confirme sua senha"),
  })
  .refine((value) => value.password === value.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem",
  });

export function useResetPasswordForm(token: string, onError: (invalid: boolean) => void) {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: { password: "", confirmation: "" },
    validators: { onDynamic: schema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      try {
        const validated = schema.parse(value);
        await resetPassword({ resetToken: token, novaSenha: validated.password });
        navigate("/reset-password/success", { replace: true, state: { passwordReset: true } });
      } catch (error) {
        const detail = axios.isAxiosError<{ detail?: unknown }>(error)
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
  const values = useSelector(form.store, (state) => state.values);
  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }
  return {
    form,
    errors,
    pending,
    handleSubmit,
    limits: AUTH_FIELD_LIMITS,
    submitDisabled: !values.password || !values.confirmation || pending,
  };
}
