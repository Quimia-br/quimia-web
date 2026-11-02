import { isAxiosError } from "axios";
import { lazy, Suspense } from "react";
import Card from "@/components/Card";
import BasicButton from "@/components/BasicButton";
import { Skeleton } from "@/components/ui/skeleton";
import { useHomeSummary } from "@/hooks/use-company-reports";
import { reportNumber, reportPercent } from "@/lib/company-reports";
import type { HomeSummary } from "@/services/relatorios";

const headingStyle = "[&_hgroup_h2]:text-xl [&_hgroup_p]:text-sm [&_hgroup_p]:leading-tight";
const HomeMixtureDonut = lazy(() => import("@/components/HomeMixtureDonut"));

function MixtureChart({ mixtures }: { mixtures: HomeSummary["misturas"] }) {
  const evaluated = mixtures.bemSucedidas + mixtures.malSucedidas;
  const rate = evaluated ? mixtures.bemSucedidas / evaluated : null;
  const series = [
    { resultado: "sucesso", valor: mixtures.bemSucedidas, label: "Bem-sucedidas" },
    { resultado: "falha", valor: mixtures.malSucedidas, label: "Mal-sucedidas" },
  ];

  return (
    <>
      {rate === null ? (
        <div className="flex min-h-52 flex-1 items-center justify-center text-center text-sm">
          <p>Ainda não há misturas avaliadas.</p>
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-52 w-full max-w-80" aria-hidden="true">
            <Suspense fallback={<Skeleton className="mx-auto size-44 rounded-full" />}>
              <HomeMixtureDonut data={series} />
            </Suspense>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
              <span className="text-2xl font-medium tabular-nums">
                {reportPercent.format(rate)}
              </span>
              <span className="text-xs text-foreground-subtle">de sucesso</span>
            </div>
          </div>
          <p className="sr-only">
            {reportPercent.format(rate)} de sucesso em {reportNumber.format(evaluated)} misturas
            avaliadas.
          </p>
          <ul
            className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"
            aria-label="Resultados das misturas"
          >
            {series.map((row) => (
              <li key={row.resultado} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 rounded-full ${row.resultado === "sucesso" ? "bg-brand-accent" : "bg-chart-1"}`}
                />
                {row.label}: {reportNumber.format(row.valor)}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-auto flex flex-col gap-1 pt-2">
        <p className="text-base font-medium">Compatibilidades com seus produtos</p>
        <p className="text-xs text-foreground-subtle">
          {reportNumber.format(mixtures.naoAvaliadas)} misturas ainda não avaliadas.
        </p>
      </div>
    </>
  );
}

export default function HomeStatistics() {
  const query = useHomeSummary();
  const summary = query.isError ? undefined : query.data;
  const metrics = [
    {
      title: "Produtos em estantes",
      description: "Quantidade de produtos colocados em estantes",
      value: summary?.produtosEmEstantes,
      unit: "produtos em estantes",
    },
    {
      title: "Total de misturas",
      description: "Misturas realizadas com seus produtos",
      value: summary?.misturas.total,
      unit: "misturas no total",
    },
  ];

  return (
    <section
      aria-label="Indicadores da empresa"
      aria-busy={query.isPending}
      className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2"
    >
      {metrics.map((metric) => (
        <Card
          key={metric.title}
          title={metric.title}
          description={metric.description}
          className={`min-h-56 min-w-0 p-6 lg:p-8 ${headingStyle}`}
        >
          <div className="flex min-h-24 flex-1 items-center justify-center">
            {query.isPending ? (
              <Skeleton className="h-10 w-28" />
            ) : metric.value === undefined ? (
              <span className="text-foreground-subtle" aria-label={`${metric.title}: indisponível`}>
                —
              </span>
            ) : (
              <p
                className="text-4xl font-medium tabular-nums"
                aria-label={`${reportNumber.format(metric.value)} ${metric.unit}`}
              >
                {reportNumber.format(metric.value)}
              </p>
            )}
          </div>
        </Card>
      ))}
      <Card
        title="Taxa de sucesso das misturas"
        description="Bem-sucedidas e mal-sucedidas"
        className={`min-h-[378px] min-w-0 p-6 sm:col-span-2 lg:p-8 ${headingStyle}`}
      >
        {query.isPending ? (
          <div role="status" className="flex min-h-60 flex-1 items-center justify-center">
            <span className="sr-only">Carregando indicadores</span>
            <Skeleton className="size-44 rounded-full" />
          </div>
        ) : query.isError ? (
          <div
            role="alert"
            className="flex min-h-60 flex-1 flex-col items-center justify-center gap-4 text-center text-sm"
          >
            <p>
              {isAxiosError(query.error) && query.error.response?.status === 403
                ? "Os indicadores não estão disponíveis para esta conta."
                : "Não foi possível carregar os indicadores."}
            </p>
            <BasicButton
              variant="secondary"
              size="compact"
              className="w-auto"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              Tentar novamente
            </BasicButton>
          </div>
        ) : summary ? (
          <MixtureChart mixtures={summary.misturas} />
        ) : null}
      </Card>
    </section>
  );
}
