import BasicButton from "@/components/BasicButton";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";
import LinkButton from "@/components/LinkButton";
import { useLoginForm } from "@/hooks/use-login-form";

function LoginForm() {
  const { form, errors, pending, handleSubmit, submitDisabled, errorMessage, limits } =
    useLoginForm();

  return (
    <Form className="w-full gap-6" errors={errors} onFormSubmit={handleSubmit}>
      <form.Field name="email">
        {(field) => (
          <FormTextField
            name={field.name}
            label="E-mail"
            type="email"
            maxLength={limits.email}
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
            maxLength={limits.password}
            autoComplete="current-password"
            placeholder="Quimia123@"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <LinkButton to="/reset-password">Esqueceu a senha?</LinkButton>

      <div className="flex flex-col gap-2">
        {errorMessage && (
          <p className="text-sm text-center text-destructive" role="alert">
            {errorMessage}
          </p>
        )}
        <BasicButton disabled={submitDisabled} type="submit">
          {pending ? "Entrando..." : "Entrar"}
        </BasicButton>
        <p className="text-base text-center text-muted-foreground">
          Não tem conta no Quimia? <LinkButton to="/signup">Crie já</LinkButton>
        </p>
      </div>
    </Form>
  );
}

export default LoginForm;
