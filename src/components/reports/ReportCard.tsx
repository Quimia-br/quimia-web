import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChartNoAxesCombined, TriangleAlert } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import Chart from "@/components/Chart";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import BasicButton from "@/components/BasicButton";

interface ReportCardProps<T> {
  title: string;
  description: string;
  icon: LucideIcon;
  query: UseQueryResult<T>;
  isEmpty: (data: T) => boolean;
  children: (data: T) => ReactNode;
  caption?: string;
}

function reportError(error: Error | null) {
  if (isAxiosError(error) && error.response?.status === 403)
    return "O acesso a este relatório não está disponível para esta conta.";
  return "Não foi possível carregar este relatório. Tente novamente.";
}

export default function ReportCard<T>({
  title,
  description,
  icon,
  query,
  isEmpty,
  children,
  caption,
}: ReportCardProps<T>) {
  if (query.isPending)
    return (
      <ChartSkeleton
        label={`Carregando ${title.toLocaleLowerCase("pt-BR")}`}
        className="h-full min-h-[322px]"
        contentClassName="h-40"
      />
    );
  return (
    <Chart
      title={title}
      description={description}
      icon={icon}
      className="h-full min-h-[322px]"
      contentClassName="h-auto flex-1"
      captionDescription={caption}
    >
      {query.isError ? (
        <div
          role="alert"
          className="flex min-h-44 flex-col items-center justify-center gap-4 text-center text-sm"
        >
          <TriangleAlert aria-hidden="true" className="size-6" />
          <p>{reportError(query.error)}</p>
          <BasicButton size="compact" variant="secondary" onClick={() => void query.refetch()}>
            Tentar novamente
          </BasicButton>
        </div>
      ) : isEmpty(query.data) ? (
        <div
          role="status"
          className="flex min-h-44 flex-col items-center justify-center gap-3 text-center text-sm"
        >
          <ChartNoAxesCombined aria-hidden="true" className="size-7 text-foreground-subtle" />
          <p>Ainda não há dados para este relatório.</p>
          <p className="text-foreground-subtle">
            Os dados aparecerão conforme os produtos forem utilizados.
          </p>
        </div>
      ) : (
        children(query.data)
      )}
    </Chart>
  );
}

export function ReportDataTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
}) {
  return (
    <details className="mt-4 min-w-0 text-sm">
      <summary className="w-fit cursor-pointer rounded-full px-1 font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-border-focus">
        Ver dados
      </summary>
      <div
        className="mt-3 max-h-64 overflow-auto rounded-2xl bg-surface-base p-3"
        tabIndex={0}
        role="region"
        aria-label={caption}
      >
        <table className="w-full text-left text-xs">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {headers.map((header) => (
                <th key={header} scope="col" className="p-2 font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {row.map((cell, column) => (
                  <td key={column} className="p-2 wrap-break-word">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
