import { useId, useRef, useState, type UIEvent } from "react";
import { Check, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import type { FdsAnalysis, FdsCorrection, FdsPending } from "@/types/Produto";
import { concentrationUnitSchema } from "@/lib/fds-analysis";
import BasicButton from "./BasicButton";
import { Field, FieldError, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";

const fieldLabels: Record<string, string> = {
  unidade_concentracao: "Unidade de concentração",
  secao: "Informações da seção",
  concentracao_min: "Concentração mínima",
  concentracao_max: "Concentração máxima",
  cas_numero: "Número CAS",
  primeiros_socorros: "Primeiros socorros",
  estabilidade: "Estabilidade e reatividade",
};
interface CardProps {
  pending: FdsPending;
  correction?: FdsCorrection;
  disabled: boolean;
  onCorrect: (correction: FdsCorrection | null) => void;
}
function PendingCard({ pending, correction, disabled, onCorrect }: CardProps) {
  const resolved = !!correction;
  return (
    <article
      aria-label={`Seção ${pending.secao}: ${fieldLabels[pending.campo] ?? pending.campo.replaceAll("_", " ")}`}
      className={cn(
        "flex w-[min(315px,100%)] shrink-0 snap-center flex-col gap-5 rounded-[42px] border-3 p-[29px]",
        resolved
          ? "border-brand-accent bg-surface-background"
          : "border-transparent bg-surface-background",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "flex size-[42px] shrink-0 items-center justify-center rounded-full",
            resolved
              ? "bg-feedback-success text-primary-foreground"
              : "bg-feedback-error text-foreground-error",
          )}
        >
          {resolved ? (
            <Check className="size-5" aria-hidden="true" />
          ) : (
            <TriangleAlert className="size-5" aria-hidden="true" />
          )}
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="text-xl leading-[1.2] font-medium">Seção {pending.secao}</h3>
          <p className="text-base leading-[1.2] text-muted-foreground">
            {fieldLabels[pending.campo] ?? pending.campo.replaceAll("_", " ")}
            {correction && `: ${correction.unidadeConcentracao}`}
          </p>
        </div>
      </div>
      <p className="text-sm leading-none text-muted-foreground">{pending.descricao}</p>
      {pending.composto &&
        !pending.evidencias.some((evidence) =>
          evidence.textoEvidencia
            .toLocaleLowerCase("pt-BR")
            .includes(pending.composto!.nome.toLocaleLowerCase("pt-BR")),
        ) && (
          <p className="text-sm leading-none text-muted-foreground">
            {pending.composto.nome}
            {pending.composto.casNumero && ` · CAS ${pending.composto.casNumero}`}
          </p>
        )}
      {pending.evidencias.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <h4 className="text-xl leading-[1.2] font-medium">Texto evidência</h4>
          {pending.evidencias.map((evidence, index) => (
            <blockquote
              key={index}
              className="flex flex-col gap-1 text-sm leading-none text-muted-foreground"
            >
              <p>{evidence.textoEvidencia}</p>
              {evidence.pagina !== null && (
                <cite className="text-xs leading-none not-italic">Página {evidence.pagina}</cite>
              )}
            </blockquote>
          ))}
        </div>
      )}
      {resolved && (
        <p role="status" className="sr-only">
          Unidade de concentração: {correction.unidadeConcentracao}
        </p>
      )}
      <PendingCorrection
        pending={pending}
        correction={correction}
        disabled={disabled}
        onCorrect={onCorrect}
      />
    </article>
  );
}

function PendingCorrection({ pending, correction, disabled, onCorrect }: CardProps) {
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [unit, setUnit] = useState("");
  const [error, setError] = useState<string>();
  const resolved = !!correction;
  return editing ? (
    <form
      className="flex flex-col gap-3"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = concentrationUnitSchema.safeParse(unit);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message);
          return;
        }
        if (pending.composto)
          onCorrect({ indice: pending.composto.indice, unidadeConcentracao: parsed.data });
        setEditing(false);
        setError(undefined);
      }}
    >
      <Field data-invalid={!!error}>
        <FieldLabel htmlFor={id}>Unidade de concentração</FieldLabel>
        <Input
          id={id}
          value={unit}
          maxLength={20}
          placeholder="Ex.: %"
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => {
            setUnit(event.target.value);
            setError(undefined);
          }}
        />
        {error && <FieldError id={`${id}-error`}>{error}</FieldError>}
      </Field>
      <BasicButton
        type="submit"
        size="compact"
        variant="secondary"
        className="min-h-[42px] text-sm leading-[1.2]"
        disabled={disabled}
      >
        Salvar correção
      </BasicButton>
      <BasicButton
        size="compact"
        variant="secondary"
        className="min-h-[42px] text-sm leading-[1.2]"
        onClick={() => setEditing(false)}
      >
        Voltar
      </BasicButton>
    </form>
  ) : pending.corrigivel && pending.composto ? (
    <BasicButton
      size="compact"
      variant="secondary"
      className="mt-auto min-h-[42px] text-sm leading-[1.2]"
      disabled={disabled}
      onClick={() => {
        if (resolved) onCorrect(null);
        else {
          setUnit("");
          setEditing(true);
        }
      }}
    >
      {resolved ? "Marcar como pendência" : "Marcar como resolvido"}
    </BasicButton>
  ) : (
    <p className="mt-auto text-sm text-muted-foreground">
      Este aviso será mantido ao adicionar o produto.
    </p>
  );
}

interface Props {
  analysis: FdsAnalysis;
  corrections: FdsCorrection[];
  disabled: boolean;
  onCorrect: (index: number, correction: FdsCorrection | null) => void;
}
export default function ProductFdsReview({ analysis, corrections, disabled, onCorrect }: Props) {
  const [page, setPage] = useState(0);
  const carousel = useRef<HTMLDivElement>(null);
  const reduceMotion =
    typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!analysis.pendencias.length)
    return (
      <div
        role="status"
        className="flex min-h-[194px] flex-col items-center justify-center gap-5 pt-8 pb-6 text-center"
      >
        <span className="flex h-[90px] w-[100px] items-center justify-center rounded-full bg-feedback-success text-primary-foreground">
          <Check className="size-8" aria-hidden="true" />
        </span>
        <p className="text-xl">Nenhuma pendência foi encontrada.</p>
      </div>
    );
  function onScroll(event: UIEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    const center = element.scrollLeft + element.clientWidth / 2;
    const cards = Array.from(element.children) as HTMLElement[];
    let nearest = 0;
    let distance = Infinity;
    cards.forEach((card, index) => {
      const next = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
      if (next < distance) {
        distance = next;
        nearest = index;
      }
    });
    setPage(nearest);
  }
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 py-8">
      <div
        ref={carousel}
        onScroll={onScroll}
        aria-label="Pendências da FDS"
        className="relative flex w-full snap-x snap-mandatory items-center gap-4 overflow-x-auto overscroll-x-contain px-[max(0px,calc((100%-315px)/2))] [scrollbar-width:none]"
      >
        {analysis.pendencias.map((pending, index) => (
          <PendingCard
            key={`${index}-${pending.campo}-${pending.composto?.indice}`}
            pending={pending}
            correction={corrections.find(
              (correction) => correction.indice === pending.composto?.indice && pending.corrigivel,
            )}
            disabled={disabled}
            onCorrect={(correction) => onCorrect(pending.composto!.indice, correction)}
          />
        ))}
      </div>
      {analysis.pendencias.length > 1 && (
        <nav
          aria-label="Paginação das pendências"
          className="flex max-w-full items-center justify-start gap-2 overflow-x-auto"
        >
          {analysis.pendencias.map((_, index) => (
            <button
              key={index}
              type="button"
              disabled={disabled}
              aria-label={`Pendência ${index + 1} de ${analysis.pendencias.length}`}
              aria-current={page === index ? "page" : undefined}
              onClick={() => {
                const card = carousel.current?.children[index] as HTMLElement | undefined;
                if (card && carousel.current) {
                  carousel.current.scrollTo({
                    left: card.offsetLeft + card.offsetWidth / 2 - carousel.current.clientWidth / 2,
                    behavior: reduceMotion ? "instant" : "smooth",
                  });
                  setPage(index);
                }
              }}
              className={cn(
                "flex h-11 shrink-0 items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring",
                page === index ? "w-12" : "w-[22px]",
              )}
            >
              <span
                className={cn(
                  "h-1 w-full rounded-full",
                  page === index ? "bg-foreground-primary" : "bg-secondary-primary",
                )}
              />
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
