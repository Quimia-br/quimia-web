import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import * as z from "zod";
import BasicButton from "@/components/BasicButton";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";
import { cnpjSchema, formatCNPJ } from "@/lib/utils/formatCnpj";
import LinkButton from "@/components/LinkButton";
import { clearFormDraft, loadFormDraft, useFormDraft } from "@/hooks/use-form-draft";
import { useCallback } from "react";

const STORAGE_KEY = "quimia:signup-draft";

const formSchema = z.object({
  cnpj: cnpjSchema,
  email: z.email("Informe um e-mail valido"),
  password: z.string().nonempty("Informe uma senha"),
});

function SignupForm() {
  const form = useForm({
    defaultValues: loadFormDraft(STORAGE_KEY, {
      cnpj: "",
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
    onSubmit: async () => {
      clearFormDraft("quimia:signup-draft");
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

  const selectSignupDraft = useCallback(
    (values: { cnpj: string; email: string; password: string }) => ({
      cnpj: values.cnpj,
      email: values.email,
    }),
    [],
  );

  useFormDraft(STORAGE_KEY, values, selectSignupDraft);

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <Form className="w-full gap-6" errors={errors} onFormSubmit={handleSubmit}>
      <form.Field name="cnpj">
        {(field) => (
          <FormTextField
            name={field.name}
            label="CNPJ"
            placeholder="00.000.000/0000-00"
            value={field.state.value}
            onChange={(e) => {
              field.handleChange(formatCNPJ(e.target.value));
            }}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

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
        <form.Subscribe
          selector={(state) =>
            Object.values(state.values).every(
              (value) => value.trim().length > 0,
            )
          }
        >
          {(hasAllValues) => (
            <BasicButton disabled={!hasAllValues} type="submit">
              Cadastrar
            </BasicButton>
          )}
        </form.Subscribe>
        <p className="text-base text-center text-foreground-subtle">
          Já tem conta no Quimia?{" "}
          <LinkButton to="/login">Entre aqui</LinkButton>
        </p>
      </div>
    </Form>
  );
}

export default SignupForm;
