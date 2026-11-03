import BasicButton from "@/components/BasicButton";
import Form from "@/components/smoothui/form";
import FormTextField from "@/components/FormTextField";
import LinkButton from "@/components/LinkButton";
import { useSignupForm } from "@/hooks/use-signup-form";

function SignupForm() {
  const { form, errors, pending, handleSubmit, submitDisabled, changeCnpj, limits } =
    useSignupForm();

  return (
    <Form className="w-full gap-4" errors={errors} onFormSubmit={handleSubmit}>
      <div className="flex flex-col items-start w-full gap-4 md:flex-row *:flex1">
        <form.Field name="cnpj">
          {(field) => (
            <FormTextField
              name={field.name}
              label="CNPJ"
              type="text"
              maxLength={limits.cnpj}
              placeholder="00.000.000/0000-00"
              value={field.state.value}
              onChange={(event) => changeCnpj(event.target.value)}
              onBlur={field.handleBlur}
            />
          )}
        </form.Field>

        <form.Field name="nome">
          {(field) => (
            <FormTextField
              name={field.name}
              label="Nome"
              type="text"
              maxLength={limits.nome}
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
            maxLength={limits.email}
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
            maxLength={limits.password}
            autoComplete="new-password"
            placeholder="Quimia123@"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
          />
        )}
      </form.Field>

      <div className="flex flex-col gap-2">
        <BasicButton disabled={submitDisabled} type="submit">
          {pending ? "Cadastrando..." : "Cadastrar"}
        </BasicButton>
        <p className="text-base text-center text-muted-foreground">
          Já tem conta no Quimia? <LinkButton to="/login">Entre aqui</LinkButton>
        </p>
      </div>
    </Form>
  );
}

export default SignupForm;
