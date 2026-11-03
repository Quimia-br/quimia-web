import AuthFeedback from "@/components/AuthFeedback";
import LinkButton from "@/components/LinkButton";

export default function SignupFeedback({ variant }: { variant: "success" | "error" }) {
  const success = variant === "success";
  return (
    <AuthFeedback
      variant={variant}
      extraGlow={false}
      title={
        success ? "Cadastro concluído!" : "Não foi possível realizar o cadastro. Tente novamente."
      }
    >
      <LinkButton
        to={success ? "/login" : "/signup"}
        replace
        variant="default"
        size="basic"
        className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
      >
        {success ? "Ir para login" : "Voltar para cadastro"}
      </LinkButton>
    </AuthFeedback>
  );
}

export function SignupSuccess() {
  return <SignupFeedback variant="success" />;
}
export function SignupError() {
  return <SignupFeedback variant="error" />;
}
