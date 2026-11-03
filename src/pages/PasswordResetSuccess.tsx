import AuthFeedback from "@/components/AuthFeedback";
import LinkButton from "@/components/LinkButton";
import { Navigate, useLocation } from "react-router-dom";

export default function PasswordResetSuccess() {
  const { state } = useLocation();
  // Contexto de UX apenas: a autorização da troca é feita pela API com o token.
  if (!state || state.passwordReset !== true) return <Navigate to="/reset-password" replace />;

  return (
    <AuthFeedback variant="success" title="Senha alterada com sucesso!">
      <LinkButton
        to="/login"
        replace
        variant="default"
        size="basic"
        className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
      >
        Voltar para login
      </LinkButton>
    </AuthFeedback>
  );
}
