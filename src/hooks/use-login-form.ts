import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useLogin } from "@/hooks/use-login";
import { loadFormDraft, useFormDraft } from "@/hooks/use-form-draft";
import { AUTH_FIELD_LIMITS, loginSchema } from "@/utils/validation-auth";
import type { SyntheticEvent } from "react";

const STORAGE_KEY = "quimia:login-draft";
const formSchema = z.object({ email: loginSchema.shape.email, password: loginSchema.shape.senha });
const returnLocationSchema = z.object({
  from: z.object({
    pathname: z.string(),
    search: z.string().optional(),
    hash: z.string().optional(),
  }),
});
const selectLoginDraft = (values: { email: string; password: string }) => ({ email: values.email });

function loginErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: unknown }>(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (status === 423 && detail === "blocked") {
      return "Sua conta está temporariamente bloqueada por tentativas de acesso. Aguarde alguns minutos e tente novamente.";
    }
    if (status === 403 && detail === "inactive") {
      return "Esta conta de empresa está inativa. Entre em contato com o responsável pela empresa.";
    }
    if (status !== undefined && status >= 500) {
      return "O serviço está temporariamente indisponível. Tente novamente mais tarde.";
    }
  }
  return "Não foi possível entrar. Verifique seu e-mail e senha.";
}

export function useLoginForm() {
  const login = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: loadFormDraft(STORAGE_KEY, { email: "", password: "" }),
    validators: { onDynamic: formSchema },
    validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
    onSubmit: async ({ value }) => {
      const normalized = formSchema.parse(value);
      await login.mutateAsync({ email: normalized.email, senha: normalized.password });
      const route = returnLocationSchema.safeParse(location.state as unknown);
      const from = route.success ? route.data.from : undefined;
      const destination =
        from && from.pathname.startsWith("/") && !from.pathname.startsWith("//")
          ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
          : "/";
      navigate(destination, { replace: true });
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
  useFormDraft(STORAGE_KEY, values, selectLoginDraft);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await form.handleSubmit();
    } catch {
      // React Query exposes the mutation failure through errorMessage.
    }
  }

  return {
    form,
    errors,
    pending,
    handleSubmit,
    limits: AUTH_FIELD_LIMITS,
    submitDisabled: !values.email.trim() || values.password.length === 0 || pending,
    errorMessage: login.isError ? loginErrorMessage(login.error) : null,
  };
}
