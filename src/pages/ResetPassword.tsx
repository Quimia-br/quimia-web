import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import AuthFeedback from "@/components/AuthFeedback";
import BasicButton from "@/components/BasicButton";
import LinkButton from "@/components/LinkButton";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import ResetPasswordForm from "@/components/ResetPasswordForm";

function PasswordRecovery({ token }: { token: string | null }) {
  const [failure, setFailure] = useState<"request" | "reset" | "invalid" | null>(
    token !== null && (!token.trim() || token.length > 2048) ? "invalid" : null,
  );

  return (
    <>
      <div hidden={failure !== null}>
        <AuthLayout>
          {token === null ? (
            <ForgotPasswordForm onError={() => setFailure("request")} />
          ) : (
            <ResetPasswordForm
              token={token}
              onError={(invalid) => setFailure(invalid ? "invalid" : "reset")}
            />
          )}
        </AuthLayout>
      </div>
      {failure && (
        <AuthFeedback
          variant="error"
          title={
            failure === "request"
              ? "Não foi possível enviar o e-mail. Tente novamente."
              : "Não foi possível resetar sua senha. Tente novamente."
          }
          description={
            failure === "invalid"
              ? "Este link é inválido ou expirou. Solicite um novo link para recuperar sua senha."
              : undefined
          }
        >
          {failure === "invalid" ? (
            <LinkButton
              to="/reset-password"
              replace
              variant="default"
              size="basic"
              className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
            >
              Solicitar novo link
            </LinkButton>
          ) : (
            <BasicButton
              className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
              onClick={() => setFailure(null)}
            >
              Tentar novamente
            </BasicButton>
          )}
          <LinkButton to="/login">Voltar para login</LinkButton>
        </AuthFeedback>
      )}
    </>
  );
}

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  return <PasswordRecovery key={token === null ? "request" : `token:${token}`} token={token} />;
}
