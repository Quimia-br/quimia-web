import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { clearFormDraft, loadFormDraft, useFormDraft } from "@/hooks/use-form-draft";
import { register as registerCompany } from "@/services/auth";
import { formatCNPJ } from "@/lib/utils/formatCnpj";
import { AUTH_FIELD_LIMITS, registerSchema } from "@/lib/utils/validation-auth";
import type { RegisterRequest } from "@/types/AuthState";
import type { SyntheticEvent } from "react";

const STORAGE_KEY = "quimia:signup-draft";
const registrationErrors: Record<string, { field: "email" | "cnpj" | "senha"; message: string }> = {
  email_in_use: { field: "email", message: "Este e-mail já está em uso." },
  cnpj_in_use: { field: "cnpj", message: "Este CNPJ já está cadastrado." },
  invalid_cnpj: { field: "cnpj", message: "O CNPJ informado é inválido." },
  weak_password: {
    field: "senha",
    message: "Use uma senha com pelo menos 8 caracteres, uma letra e um número.",
  },
  password_too_long: {
    field: "senha",
    message: "A senha deve ter no máximo 72 bytes.",
  },
};
const selectSignupDraft = (values: RegisterRequest) => ({
  nome: values.nome,
  cnpj: values.cnpj,
  email: values.email,
});

export function useSignupForm() {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: loadFormDraft(STORAGE_KEY, {
      nome: "",
      cnpj: "",
      email: "",
      senha: "",
    }),
    validators: { onDynamic: registerSchema },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    onSubmit: async ({ value }) => {
      try {
        await registerCompany(registerSchema.parse(value));
        clearFormDraft(STORAGE_KEY);
        navigate("/signup/success", { replace: true });
      } catch (error) {
        const detail = axios.isAxiosError<{ detail?: unknown }>(error)
          ? error.response?.data?.detail
          : undefined;
        const fieldError = typeof detail === "string" ? registrationErrors[detail] : undefined;
        if (fieldError) {
          form.setFieldMeta(fieldError.field, (previous) => ({
            ...previous,
            errorMap: { ...previous.errorMap, onSubmit: fieldError.message },
          }));
          return;
        }
        navigate("/signup/error", { replace: true });
      }
    },
  });
  const errors = useSelector(form.store, (state) =>
    Object.fromEntries(
      Object.entries(state.fieldMeta).map(([field, meta]) => {
        const issue = meta.errors[0];
        return [field, typeof issue === "string" ? issue : issue?.message];
      }),
    ),
  );
  const values = useSelector(form.store, (state) => state.values);
  const pending = useSelector(form.store, (state) => state.isSubmitting);
  useFormDraft(STORAGE_KEY, values, selectSignupDraft);

  function changeCnpj(value: string) {
    // Preserve the existing numeric mask and accept the alphanumeric API format.
    form.setFieldValue("cnpj", /[A-Za-z]/.test(value) ? value.toUpperCase() : formatCNPJ(value));
  }
  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.handleSubmit();
  }

  return {
    form,
    errors,
    pending,
    handleSubmit,
    changeCnpj,
    limits: AUTH_FIELD_LIMITS,
    submitDisabled:
      !values.nome.trim() ||
      !values.cnpj.trim() ||
      !values.email.trim() ||
      values.senha.length === 0 ||
      pending,
  };
}
