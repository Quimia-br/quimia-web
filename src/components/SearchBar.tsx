import { useId, useRef, type KeyboardEvent } from "react";
import { Search, X } from "lucide-react";
import { cn } from "cn";
import { InputGroup, InputGroupInput, InputGroupButton } from "./ui/input-group";
import { useSearchQuery } from "@/hooks/use-search-query";
import { useSpeechInput } from "@/hooks/use-speech-input";
import SpeechInputIcon from "./SpeechInputIcon";

interface SearchBarProps {
  label?: string;
  placeholder?: string;
  variant?: "primary" | "secondary";
  debounceMs?: number;
  voiceEnabled?: boolean;
  speechLang?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

interface SearchActionProps {
  speech: ReturnType<typeof useSpeechInput>;
  hasText: boolean;
  voiceEnabled: boolean;
  disabled: boolean;
  helpId: string;
  errorId: string;
  onVoice: () => void;
  onClear: () => void;
}

function SearchAction({ speech, hasText, voiceEnabled, disabled, helpId, errorId, onVoice, onClear }: SearchActionProps) {
  if (speech.active || (!hasText && voiceEnabled)) {
    return <VoiceSearchButton speech={speech} disabled={disabled} helpId={helpId} errorId={errorId} onVoice={onVoice} />;
  }

  if (!hasText) return null;
  return (
    <InputGroupButton
      aria-label="Limpar pesquisa"
      disabled={disabled}
      size="icon-sm"
      className="rounded-full size-10 shrink-0 text-foreground-primary focus-visible:ring-border-focus"
      onClick={onClear}
    >
      <X aria-hidden="true" className="size-6" />
    </InputGroupButton>
  );
}

function VoiceSearchButton({ speech, disabled, helpId, errorId, onVoice }: Pick<SearchActionProps, "speech" | "disabled" | "helpId" | "errorId" | "onVoice">) {
  return (
    <InputGroupButton
      aria-label={speech.active ? "Parar ditado" : "Buscar por voz"}
      aria-pressed={speech.active}
      aria-describedby={speech.error ? errorId : !speech.supported ? helpId : undefined}
      title={speech.error ?? (!speech.supported ? "Ditado por voz indisponível neste navegador" : undefined)}
      data-state={speech.speaking ? "speaking" : speech.phase}
      disabled={disabled || !speech.supported || speech.phase === "stopping"}
      size="icon-sm"
      className={cn("size-10 shrink-0 rounded-full text-foreground-primary focus-visible:ring-border-focus", speech.active && "bg-border-focus/10 text-border-focus", speech.error && "text-destructive")}
      onClick={onVoice}
    >
      <SpeechInputIcon speech={speech} />
    </InputGroupButton>
  );
}

const speechStatus = {
  idle: "",
  starting: "Autorize o microfone para iniciar o ditado.",
  listening: "Ouvindo… Fale o que deseja pesquisar.",
  stopping: "Finalizando ditado…",
};

function SearchBar({
  label = "Pesquisar",
  placeholder = label,
  variant = "primary",
  debounceMs = 400,
  voiceEnabled = true,
  speechLang = "pt-BR",
  disabled = false,
  id,
  className,
}: SearchBarProps) {
  const generatedId = useId();
  const inputId = id ?? `search-${generatedId}`;
  const helpId = `${inputId}-voice-help`;
  const errorId = `${inputId}-voice-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const query = useSearchQuery(debounceMs, disabled);
  const speech = useSpeechInput({
    enabled: voiceEnabled && !disabled,
    language: speechLang,
    scope: query.scope,
    onFinal: query.change,
  });
  const value = speech.active ? speech.transcript || query.value : query.value;
  const hasText = value.length > 0;

  function apply() {
    if (disabled) return;
    speech.cancel();
    query.apply(value);
    inputRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault();
      apply();
    } else if (event.key === "Escape" && speech.active) {
      event.preventDefault();
      speech.cancel();
    }
  }

  return (
    <search aria-label={label} className={cn("block w-full min-w-0 max-w-[398px]", className)}>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <InputGroup
        data-variant={variant}
        className={cn(
          "h-16 gap-3 rounded-[60px] border-0 px-4 shadow-none has-disabled:opacity-100",
          "focus-within:ring-3 focus-within:ring-border-focus",
          "has-[[data-slot=input-group-control]:focus-visible]:ring-border-focus",
          variant === "secondary" ? "bg-secondary has-disabled:bg-secondary dark:bg-secondary dark:has-disabled:bg-secondary" : "bg-card has-disabled:bg-card dark:bg-card dark:has-disabled:bg-card",
        )}
      >
        <label htmlFor={inputId} aria-hidden="true" className="flex items-center justify-center size-10 shrink-0 cursor-text text-foreground-primary">
          <Search aria-hidden="true" className="size-6" />
        </label>
        <InputGroupInput
          ref={inputRef}
          id={inputId}
          type="search"
          name="q"
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-describedby={speech.error ? errorId : undefined}
          className="h-full min-w-0 px-0 py-0 text-lg font-medium text-foreground-primary placeholder:text-foreground-subtle md:text-lg [&::-webkit-search-cancel-button]:hidden"
          onChange={(event) => { speech.cancel(); query.change(event.target.value); }}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => { speech.cancel(); query.setComposing(true); }}
          onCompositionEnd={(event) => { query.change(event.currentTarget.value); query.setComposing(false); }}
        />
        <SearchAction
          speech={speech}
          hasText={hasText}
          voiceEnabled={voiceEnabled}
          disabled={disabled}
          helpId={helpId}
          errorId={errorId}
          onVoice={() => {
            if (speech.active) speech.stop();
            else { query.cancelPending(); speech.start(); }
            inputRef.current?.focus();
          }}
          onClear={() => { speech.cancel(); query.apply(""); inputRef.current?.focus(); }}
        />
      </InputGroup>
      {voiceEnabled && !speech.supported && <p id={helpId} className="sr-only">O ditado por voz não está disponível neste navegador. Digite a pesquisa.</p>}
      {speech.active && <p role="status" className="sr-only">{speech.speaking ? "Fala detectada." : speechStatus[speech.phase]}</p>}
      {speech.error && <p id={errorId} role="alert" className="sr-only">{speech.error}</p>}
    </search>
  );
}

export default SearchBar;
