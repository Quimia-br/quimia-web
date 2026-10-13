import { useEffect, useRef, useState } from "react";
import { withFinally } from "@/lib/utils/withFinally";

interface MessageDraftOptions {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSend: (message: string) => void | Promise<void>;
  blocked: boolean;
  maxLength?: number;
}

export function useMessageDraft({ value, defaultValue = "", onValueChange, onSend, blocked, maxLength }: MessageDraftOptions) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = value ?? localValue;
  const latestDraft = useRef(draft);
  const mounted = useRef(true);
  const locked = useRef(false);

  useEffect(() => { latestDraft.current = draft; }, [draft]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  function change(next: string) {
    if (locked.current) return;
    setError(null);
    if (value === undefined) setLocalValue(next);
    onValueChange?.(next);
  }

  async function send(text: string) {
    const message = text.trim();
    if (locked.current || blocked || !message || (maxLength !== undefined && text.length > maxLength)) return false;
    locked.current = true;
    setSending(true);
    setError(null);
    const snapshot = draft;
    let accepted = false;
    await withFinally(async () => {
    try {
      await onSend(message);
      if (mounted.current && latestDraft.current === snapshot) {
        if (value === undefined) setLocalValue("");
        onValueChange?.("");
      }
      accepted = true;
    } catch {
      if (mounted.current) setError("Não foi possível enviar a mensagem. Tente novamente.");
    }
    }, () => {
      locked.current = false;
      if (mounted.current) setSending(false);
    });
    return accepted;
  }

  return { value: draft, change, sending, error, send };
}
