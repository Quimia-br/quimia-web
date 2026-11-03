import { Button } from "@/components/ui/button";
import LinkButton from "@/components/LinkButton";
import MainTitle from "@/components/MainTitle";
import { useRecoveryEmail } from "@/hooks/use-recovery-email";

interface RecoveryEmailSentProps {
  email: string;
}

export default function RecoveryEmailSent({ email }: RecoveryEmailSentProps) {
  const { remaining, pending, failed, resend, resendDisabled } = useRecoveryEmail(email);

  return (
    <>
      <div role="status">
        <MainTitle
          title="Verifique seu e-mail"
          description="Se este e-mail estiver cadastrado, você receberá instruções para recuperar sua senha. Confira também a caixa de spam."
        />
      </div>
      <div className="flex flex-col items-center gap-3">
        <LinkButton
          to="mailto:"
          variant="default"
          size="basic"
          className="min-[480px]:text-2xl/[1.2] max-[480px]:text-xl/[1.2]"
        >
          Abrir meu e-mail padrão
        </LinkButton>
        {failed && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível reenviar o e-mail. Tente novamente.
          </p>
        )}
        <Button variant="link" disabled={resendDisabled} onClick={resend}>
          {pending ? "Reenviando..." : remaining > 0 ? `(${remaining}s) Reenviar` : "Reenviar"}
        </Button>
        <LinkButton to="/login">Voltar para login</LinkButton>
      </div>
    </>
  );
}
