import { cn } from "cn";
import { LazyMotion, domAnimation, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { usePageQuery } from "@/hooks/use-page-query";

type PageIndicatorProps = {
  /** Total returned by the API for the current search and page size. */
  totalPages: number;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export default function PageIndicator({
  totalPages,
  disabled = false,
  label = "Paginação",
  className,
}: PageIndicatorProps) {
  const total =
    Number.isSafeInteger(totalPages) && totalPages > 0 ? totalPages : 0;
  const { page, changePage } = usePageQuery(total);
  const reduceMotion = useReducedMotion();

  if (total < 2) return null;

  const pages = Array.from({ length: total }, (_, index) => index + 1);

  return (
    <LazyMotion features={domAnimation}>
      <nav
        aria-label={label}
        className={cn("flex w-full min-w-0 items-center px-3", className)}
        // Keep spacing proportional when there are many pages in a narrow container.
        style={{ columnGap: `min(0.5rem, ${25 / total}%)` }}
      >
        {pages.map((number) => {
          const active = number === page;
          return (
            <m.button
              key={number}
              type="button"
              aria-label={`Página ${number} de ${total}`}
              aria-current={active ? "page" : undefined}
              title={`Página ${number} de ${total}`}
              disabled={disabled}
              onClick={() => changePage(number)}
              initial={false}
              animate={{ flexGrow: active ? 3 : 1 }}
              transition={{
                // PI, for those who don't now :)
                duration: reduceMotion ? 0 : 0.314159265359,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex items-center flex-1 min-w-0 p-0 bg-transparent border-0 rounded-full outline-none cursor-pointer group h-9 disabled:cursor-default disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-1 w-full rounded-full motion-safe:transition-colors motion-safe:duration-500 motion-safe:ease-in-out",
                  active ? "bg-foreground-primary" : "bg-secondary",
                  "group-focus-visible:bg-border-focus",
                )}
              />
            </m.button>
          );
        })}
        <span className="sr-only" role="status">
          Página {page} de {total}
        </span>
      </nav>
    </LazyMotion>
  );
}
