import { revalidateLogic, useForm, useSelector } from "@tanstack/react-form";
import * as z from "zod";
import BasicButton from "@/components/BasicButton";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";
import { cnpjSchema, formatCNPJ } from "@/lib/utils/formatCnpj";
import LinkButton from "@/components/LinkButton";
import {
  clearFormDraft,
  loadFormDraft,
  useFormDraft,
} from "@/hooks/use-form-draft";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { register as registerCompany } from "@/services/auth";
import axios from "axios";

const STORAGE_KEY = "quimia:signup-draft";
const registrationErrors: Record<string, { field: "email" | "cnpj" | "senha"; message: string }> = {
  email_in_use: { field: "email", message: "Este e-mail já está em uso." },
  cnpj_in_use: { field: "cnpj", message: "Este CNPJ já está cadastrado." },
  invalid_cnpj: { field: "cnpj", message: "O CNPJ informado é inválido." },
  weak_password: { field: "senha", message: "Use uma senha com pelo menos 8 caracteres, uma letra e um número." },
  password_too_long: { field: "senha", message: "A senha deve ter no máximo 72 bytes." },
};

const formSchema = z.object({
  nome: z.string().nonempty("Informe o nome da empresa"),
  cnpj: cnpjSchema,
  email: z.email("Informe um e-mail valido"),
  senha: z.string().nonempty("Informe uma senha"),
});

function SignupForm() {
  const [registrationError, setRegistrationError] = useState(false);
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: loadFormDraft(STORAGE_KEY, {
      nome: "",
      cnpj: "",
      email: "",
      senha: "",
    }),
    validators: {
      onDynamic: formSchema,
    },
    validationLogic: revalidateLogic({
      mode: "submit",
      modeAfterSubmission: "change",
    }),
    onSubmit: async ({ value }) => {
      setRegistrationError(false);

      try {
        await registerCompany({
          nome: value.nome,
          cnpj: value.cnpj,
          email: value.email,
          senha: value.senha,
        });

        clearFormDraft(STORAGE_KEY);

        navigate("/login", { replace: true });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          const apiError = error.response?.data as
            | { detail?: string }
            | undefined;
          const fieldError = registrationErrors[apiError?.detail ?? ""];
          if (fieldError) {
            form.setFieldMeta(fieldError.field, (prev) => ({
              ...prev,
              errorMap: {
                ...prev.errorMap,
                onSubmit: fieldError.message,
              },
            }));
            return;
          }
        }

        setRegistrationError(true);
      }
    },
  });
  const errors = useSelector(form.store, (state) => {
    return Object.fromEntries(
      Object.entries(state.fieldMeta).map(([field, meta]) => {
        const issue = meta.errors[0];
        return [field, typeof issue === "string" ? issue : issue?.message ?? ""];
      }),
    );
  });

  const values = useSelector(form.store, (state) => state.values);

  const selectSignupDraft = useCallback(
    (values: { nome: string; cnpj: string; email: string; senha: string }) => ({
      nome: values.nome,
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
    <Form className="w-full gap-4" errors={errors} onFormSubmit={handleSubmit}>
      <div className="flex flex-col items-start w-full gap-4 md:flex-row *:flex1">
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

        <form.Field name="nome">
          {(field) => (
            <FormTextField
              name={field.name}
              label="Nome"
              placeholder="Quimia"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>
      </div>

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

      <form.Field name="senha">
        {(field) => (
          <FormTextField
            name={field.name}
            label="Senha"
            type="password"
            autoComplete="new-password"
            placeholder="Quimia123@"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="flex flex-col gap-2">
        {registrationError && !Object.values(errors).some(Boolean) && (
          <p className="text-sm text-center text-destructive" role="alert">
            Não foi possível cadastrar. Tente novamente.
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
              {isSubmitting ? "Cadastrando..." : "Cadastrar"}
            </BasicButton>
          )}
        </form.Subscribe>
        <p className="text-base text-center text-muted-foreground">
          Já tem conta no Quimia?{" "}
          <LinkButton to="/login">Entre aqui</LinkButton>
        </p>
      </div>
    </Form>
  );
}

export default SignupForm;
