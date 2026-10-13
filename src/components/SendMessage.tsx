import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  LoaderCircle,
  SendHorizontal,
  Square,
} from "lucide-react";
import { cn } from "cn";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "./ui/input-group";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { ScrollArea } from "./ui/scroll-area";
import { useMessageDraft } from "@/hooks/use-message-draft";
import { useSpeechInput } from "@/hooks/use-speech-input";
import SpeechInputIcon from "./SpeechInputIcon";

type DraftProps =
  | {
      value: string;
      onValueChange: (value: string) => void;
      defaultValue?: never;
    }
  | {
      value?: never;
      defaultValue?: string;
      onValueChange?: (value: string) => void;
    };

type SendMessageProps = DraftProps & {
  onSend: (message: string) => void | Promise<void>;
  colorScheme?: "primary" | "secondary";
  isGenerating?: boolean;
  onStop?: () => void;
  disabled?: boolean;
  voiceEnabled?: boolean;
  speechLang?: string;
  label?: string;
  placeholder?: string;
  maxLength?: number;
  id?: string;
  className?: string;
};

function SubmitIcon({
  sending,
  isGenerating,
  canStop,
}: {
  sending: boolean;
  isGenerating: boolean;
  canStop: boolean;
}) {
  if (isGenerating && canStop)
    return <Square aria-hidden="true" className="size-3" />;
  if (sending || isGenerating)
    return (
      <LoaderCircle
        aria-hidden="true"
        className="size-5 motion-safe:animate-spin"
      />
    );
  return <SendHorizontal aria-hidden="true" className="size-5" />;
}

function submitLabel(isGenerating: boolean, canStop: boolean, sending: boolean) {
  if (isGenerating) return canStop ? "Parar resposta" : "Aguardando resposta";
  return sending ? "Enviando mensagem" : "Enviar mensagem";
}

interface MessageActionsProps {
  speech: ReturnType<typeof useSpeechInput>;
  voiceEnabled: boolean;
  voiceId: string;
  disabled: boolean;
  sending: boolean;
  isGenerating: boolean;
  canStop: boolean;
  cannotSend: boolean;
  colorScheme: "primary" | "secondary";
  onVoice: () => void;
  onSubmit: () => void;
}

function VoiceMessageButton({ speech, voiceId, disabled, sending, isGenerating, onVoice }: Pick<MessageActionsProps, "speech" | "voiceId" | "disabled" | "sending" | "isGenerating" | "onVoice">) {
  return (
    <InputGroupButton
      aria-label={speech.active ? "Parar ditado" : "Ditar mensagem"}
      aria-pressed={speech.active}
      aria-describedby={voiceId}
      title={speech.error ?? (!speech.supported ? "Ditado indisponível neste navegador" : undefined)}
      disabled={disabled || sending || isGenerating || !speech.supported || speech.phase === "stopping"}
      data-state={speech.speaking ? "speaking" : speech.phase}
      size="icon-sm"
      className={cn(
        "size-8 rounded-full text-foreground-primary focus-visible:ring-border-focus",
        speech.active && "text-border-focus",
        speech.error && "text-destructive",
      )}
      onClick={onVoice}
    >
      <SpeechInputIcon speech={speech} />
    </InputGroupButton>
  );
}

function MessageActions({ speech, voiceEnabled, voiceId, disabled, sending, isGenerating, canStop, cannotSend, colorScheme, onVoice, onSubmit }: MessageActionsProps) {
  return (
    <InputGroupAddon align="inline-end" className="shrink-0 self-end items-center gap-3 p-0 [&>button]:m-0">
      {voiceEnabled && <VoiceMessageButton speech={speech} voiceId={voiceId} disabled={disabled}
        sending={sending} isGenerating={isGenerating} onVoice={onVoice} />}
      <InputGroupButton
        aria-label={submitLabel(isGenerating, canStop, sending)}
        disabled={cannotSend}
        size="icon-sm"
        className={cn(
          "size-10 rounded-full text-foreground-primary focus-visible:ring-border-focus",
          colorScheme === "primary" ? "bg-secondary hover:bg-secondary-hover" : "bg-card hover:bg-muted",
        )}
        onClick={onSubmit}
      >
        <SubmitIcon sending={sending} isGenerating={isGenerating} canStop={canStop} />
      </InputGroupButton>
    </InputGroupAddon>
  );
}

function VoiceMessageStatus({ speech, voiceId }: { speech: ReturnType<typeof useSpeechInput>; voiceId: string }) {
  let message = "";
  if (speech.error) message = speech.error;
  else if (!speech.supported) message = "Ditado indisponível neste navegador. Digite a mensagem.";
  else if (speech.active) message = "Ditado ativo.";
  return <span id={voiceId} className="sr-only" role={speech.error ? "alert" : "status"}>{message}</span>;
}

function messageDisplayState({ draftValue, draftError, sending, speechActive, transcript, voiceBase, maxLength, disabled, isGenerating, canStop }: {
  draftValue: string;
  draftError: string | null;
  sending: boolean;
  speechActive: boolean;
  transcript: string;
  voiceBase: string;
  maxLength: number | undefined;
  disabled: boolean;
  isGenerating: boolean;
  canStop: boolean;
}) {
  const text = speechActive && transcript ? appendSpeech(voiceBase, transcript) : draftValue;
  const overLimit = maxLength !== undefined && text.length > maxLength;
  const error = overLimit ? `A mensagem excede o limite de ${maxLength} caracteres.` : draftError;
  const cannotSend = disabled || (!canStop && (sending || isGenerating || !text.trim() || overLimit));
  return { text, error, cannotSend };
}

function SendMessage({
  colorScheme = "secondary",
  isGenerating = false,
  onStop,
  disabled = false,
  voiceEnabled = true,
  speechLang = "pt-BR",
  label = "Mensagem",
  placeholder = "Escreva uma mensagem",
  maxLength,
  id,
  className,
  ...draftProps
}: SendMessageProps) {
  const generatedId = useId();
  const inputId = id ?? `message-${generatedId}`;
  const errorId = `${inputId}-error`,
    voiceId = `${inputId}-voice`;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const [voiceBase, setVoiceBase] = useState("");
  const draft = useMessageDraft({
    ...draftProps,
    blocked: disabled || isGenerating,
    maxLength,
  });
  const speech = useSpeechInput({
    enabled: voiceEnabled && !disabled && !draft.sending && !isGenerating,
    language: speechLang,
    scope: generatedId,
    // The recognizer captures this callback on start, preserving that draft.
    onFinal: (text) => draft.change(appendSpeech(draft.value, text)),
  });
  const canStop = isGenerating && !!onStop;
  const { text, error, cannotSend } = messageDisplayState({
    draftValue: draft.value, draftError: draft.error, sending: draft.sending,
    speechActive: speech.active, transcript: speech.transcript, voiceBase,
    maxLength, disabled, isGenerating, canStop,
  });

  async function submit() {
    if (disabled) return;
    if (canStop) {
      onStop?.();
      return;
    }
    if (cannotSend) return;
    speech.cancel();
    await draft.send(text);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Escape" && speech.active) {
      event.preventDefault();
      speech.cancel();
    }
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !composing.current &&
      !event.nativeEvent.isComposing &&
      event.nativeEvent.keyCode !== 229
    ) {
      event.preventDefault();
      // Enter is always a send shortcut; stopping a response requires its button.
      if (!isGenerating) void submit();
    }
  }

  return (
    <Field
      data-invalid={!!error}
      className={cn("w-full min-w-0 max-w-[424px] gap-2", className)}
    >
      <FieldLabel htmlFor={inputId} className="sr-only">
        {label}
      </FieldLabel>
      <InputGroup
        data-color-scheme={colorScheme}
        aria-busy={draft.sending || isGenerating}
        className={cn(
          "h-auto min-h-16 items-center gap-3 rounded-[33px] border-0 px-4 py-3 shadow-none has-disabled:opacity-100 focus-within:ring-3 focus-within:ring-border-focus has-[[data-slot=input-group-control]:focus-visible]:ring-border-focus",
          colorScheme === "primary"
            ? "bg-card has-disabled:bg-card dark:bg-card dark:has-disabled:bg-card"
            : "bg-secondary has-disabled:bg-secondary dark:bg-secondary dark:has-disabled:bg-secondary",
        )}
      >
        <ScrollArea
          className="flex-1 min-w-0"
          viewportClassName="max-h-40 h-full overscroll-contain [&>div]:block! [&>div]:w-full [&>div]:min-w-0"
          maskHeight={8}
          maskClassName={
            colorScheme === "primary"
              ? "before:from-card after:from-card"
              : "before:from-secondary after:from-secondary"
          }
        >
          <InputGroupTextarea
            ref={inputRef}
            id={inputId}
            name="message"
            rows={1}
            value={text}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={draft.sending}
            maxLength={maxLength}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="min-h-5 h-full overflow-hidden px-0 py-0 pr-3 font-medium leading-5 text-foreground-primary not-supports-[field-sizing:content]:max-h-40 not-supports-[field-sizing:content]:overflow-y-auto md:text-sm"
            onChange={(event) => {
              if (disabled || draft.sending) return;
              speech.cancel();
              draft.change(event.target.value);
            }}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => {
              composing.current = true;
              speech.cancel();
            }}
            onCompositionEnd={() => {
              composing.current = false;
            }}
          />
        </ScrollArea>
        <MessageActions speech={speech} voiceEnabled={voiceEnabled} voiceId={voiceId}
          disabled={disabled} sending={draft.sending} isGenerating={isGenerating}
          canStop={canStop} cannotSend={cannotSend} colorScheme={colorScheme}
          onVoice={() => {
            if (speech.active) speech.stop();
            else {
              setVoiceBase(draft.value);
              speech.start();
            }
            inputRef.current?.focus();
          }}
          onSubmit={() => { void submit(); }} />
      </InputGroup>
      {error && <FieldError id={errorId}>{error}</FieldError>}
      {voiceEnabled && <VoiceMessageStatus speech={speech} voiceId={voiceId} />}
    </Field>
  );
}

function appendSpeech(base: string, speech: string) {
  return base + (base && !/\s$/.test(base) ? " " : "") + speech;
}

export default SendMessage;
