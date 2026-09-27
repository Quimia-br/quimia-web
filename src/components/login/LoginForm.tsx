import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import * as z from "zod";
import BasicButton from "@/components/BasicButton";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";
import LinkButton from "@/components/LinkButton";
import { useLogin } from "@/hooks/use-login";
import { useLocation, useNavigate } from "react-router-dom";
import { loadFormDraft, useFormDraft } from "@/hooks/use-form-draft";
import { useCallback } from "react";

const STORAGE_KEY = "quimia:login-draft";

const formSchema = z.object({
  email: z.email("Informe um e-mail valido"),
  password: z.string().nonempty("Informe uma senha"),
});

function LoginForm() {
  const login = useLogin();
  const location = useLocation();
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: loadFormDraft(STORAGE_KEY, {
      email: "",
      password: "",
    }),
    validators: {
      onDynamic: formSchema,
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    onSubmit: async ({ value }) => {
      await login.mutateAsync({
        email: value.email,
        senha: value.password,
      });

      const from = location.state?.from;
      const destination = from
        ? `${from.pathname}${from.search ?? ""}${from.hash ?? ""}`
        : "/";

      navigate(destination, { replace: true });
    },
  });
  const errors = useSelector(form.store, (state) => {
    const rawErrors = state.errorMap.onDynamic;
    if (!rawErrors) return undefined;

    return Object.fromEntries(
      Object.entries(rawErrors).map(([field, issues]) => [
        field,
        issues?.[0]?.message || "",
      ]),
    );
  });

  const values = useSelector(form.store, (state) => state.values);

  const selectLoginDraft = useCallback(
    (current: typeof values) => ({
      email: current.email,
    }),
    [],
  );

  useFormDraft(STORAGE_KEY, values, selectLoginDraft);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await form.handleSubmit();
    } catch {
      // error
    }
  };

  return (
    <Form className="w-full gap-6" errors={errors} onFormSubmit={handleSubmit}>
      <form.Field name="email">
        {(field) => (
          <FormTextField
            name={field.name}
            label="E-mail"
            type="email"
            autoComplete="email"
            placeholder="email.exemplo@quimia.com"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <form.Field name="password">
        {(field) => (
          <FormTextField
            name={field.name}
            label="Senha"
            type="password"
            autoComplete="current-password"
            placeholder="Quimia123@"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="flex flex-col gap-2">
        {login.isError && (
          <p className="text-sm text-center text-destructive" role="alert">
            Não foi possível entrar. Verifique seu e-mail e senha.
          </p>
        )}
        <form.Subscribe
          selector={(state) => ({
            hasAllValues: Object.values(state.values).every(
              (value) => value.trim().length > 0,
            ),
            isSubmitting: state.isSubmitting,
          })}
        >
          {({ hasAllValues, isSubmitting }) => (
            <BasicButton disabled={!hasAllValues || isSubmitting} type="submit">
              {isSubmitting ? "Entrando..." : "Entrar"}
            </BasicButton>
          )}
        </form.Subscribe>
        <p className="text-base text-center text-foreground-subtle">
          Não tem conta no Quimia? <LinkButton to="/signup">Crie já</LinkButton>
        </p>
      </div>
    </Form>
  );
}

export default LoginForm;
