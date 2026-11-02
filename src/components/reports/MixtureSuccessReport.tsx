import { FlaskConical } from "lucide-react";
import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import { useStatisticsReport } from "@/hooks/use-company-reports";
import { getMixtureSuccess, reportNumber, reportPercent } from "@/lib/company-reports";
import ReportCard, { ReportDataTable } from "./ReportCard";
import { mixturesConfig } from "./chart-config";

export default function MixtureSuccessReport() {
  const query = useStatisticsReport();
  return (
    <ReportCard
      title="Taxa de sucesso das misturas"
      description="Resultados das misturas com seus produtos"
      icon={FlaskConical}
      query={query}
      isEmpty={(data) =>
        !data.cards.some((card) => card.id === "taxa_sucesso_misturas" && card.tipo === "rosca")
      }
      caption="A taxa considera apenas misturas avaliadas. Misturas não avaliadas ficam fora do cálculo."
    >
      {(data) => {
        const series = data.cards.find((card) => card.id === "taxa_sucesso_misturas")!.series;
        const rate = getMixtureSuccess(series);
        const evaluated = series.reduce((sum, row) => sum + row.valor, 0);
        return (
          <>
            {rate === null ? (
              <div
                role="status"
                className="flex h-52 flex-col items-center justify-center gap-3 text-center"
              >
                <p className="text-4xl font-medium">—</p>
                <p className="text-sm">Ainda não há misturas avaliadas.</p>
              </div>
            ) : (
              <>
                <div className="relative mx-auto h-52 w-full max-w-80" aria-hidden="true">
                  <EChartsPieChart
                    data={series.map((row) => ({
                      resultado: row.rotulo === "Bem sucedida" ? "sucesso" : "falha",
                      valor: row.valor,
                    }))}
                    config={mixturesConfig}
                    dataKey="valor"
                    nameKey="resultado"
                    className="h-full w-full"
                  >
                    <EChartsPieChart.Pie
                      innerRadius="60%"
                      outerRadius="90%"
                      paddingAngle={0}
                      isClickable={false}
                    />
                    <EChartsPieChart.Tooltip />
                  </EChartsPieChart>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                    <span className="text-3xl font-medium tabular-nums">
                      {reportPercent.format(rate)}
                    </span>
                    <span className="text-xs text-foreground-subtle">de sucesso</span>
                  </div>
                </div>
                <p className="sr-only">
                  Taxa de sucesso: {reportPercent.format(rate)} em {reportNumber.format(evaluated)}{" "}
                  misturas avaliadas.
                </p>
                <ul
                  className="mt-3 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs"
                  aria-label="Resultados das misturas"
                >
                  {series.map((row) => (
                    <li key={row.rotulo} className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2.5 shrink-0 rounded-full ${row.rotulo === "Bem sucedida" ? "bg-brand-accent" : "bg-chart-1"}`}
                      />
                      {row.rotulo}: {reportNumber.format(row.valor)}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <ReportDataTable
              caption="Resultados das misturas avaliadas"
              headers={["Resultado", "Misturas"]}
              rows={series.map((row) => [row.rotulo, reportNumber.format(row.valor)])}
            />
          </>
        );
      }}
    </ReportCard>
  );
}
