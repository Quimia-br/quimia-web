import { useEffect, useRef, useState } from "react";
import { forgotPassword } from "@/services/auth";

export function useRecoveryEmail(email: string) {
  const [remaining, setRemaining] = useState(60);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  async function resend() {
    if (sending.current || remaining > 0) return;
    sending.current = true;
    setPending(true);
    setFailed(false);
    try {
      await forgotPassword(email);
      setRemaining(60);
    } catch {
      setFailed(true);
    } finally {
      sending.current = false;
      setPending(false);
    }
  }
  return { remaining, pending, failed, resend, resendDisabled: remaining > 0 || pending };
}
