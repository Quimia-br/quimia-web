import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LinkButton from "@/components/LinkButton";
import MainTitle from "@/components/MainTitle";
import { forgotPassword } from "@/services/auth";

export default function RecoveryEmailSent({ email }: { email: string }) {
  const [remaining, setRemaining] = useState(60);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function resend() {
    if (pending || remaining > 0) return;
    setPending(true);
    setFailed(false);
    try {
      await forgotPassword(email);
      setRemaining(60);
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

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
        <Button variant="link" disabled={remaining > 0 || pending} onClick={resend}>
          {pending ? "Reenviando..." : remaining > 0 ? `(${remaining}s) Reenviar` : "Reenviar"}
        </Button>
        <LinkButton to="/login">Voltar para login</LinkButton>
      </div>
    </>
  );
}
