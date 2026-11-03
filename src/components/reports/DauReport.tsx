import { Users } from "lucide-react";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import { useDauReport } from "@/hooks/use-company-reports";
import {
  formatReportDate,
  fullReportDate,
  reportDecimal,
  reportNumber,
} from "@/lib/company-reports";
import ReportCard, { ReportDataTable } from "./ReportCard";
import { dauConfig } from "./chart-config";

export default function DauReport() {
  const query = useDauReport();
  return (
    <ReportCard
      title="Usuários ativos"
      description="Quem consulta seus produtos por dia"
      icon={Users}
      query={query}
      isEmpty={(rows) => rows.length === 0}
    >
      {(rows) => {
        const latest = rows.at(-1)!;
        return (
          <>
            <p className="mb-2 text-sm">
              <span className="text-3xl font-medium tabular-nums">
                {reportNumber.format(latest.usuariosAtivos)}
              </span>{" "}
              em {fullReportDate(latest.data)}
            </p>
            <div className="h-36" aria-hidden="true">
              <EChartsLineChart
                data={rows}
                config={dauConfig}
                className="h-full w-full"
                curveType="linear"
              >
                <EChartsLineChart.Line dataKey="usuariosAtivos" strokeWidth={2}>
                  <EChartsLineChart.Dot />
                  <EChartsLineChart.ActiveDot />
                </EChartsLineChart.Line>
                <EChartsLineChart.XAxis dataKey="data" tickFormatter={formatReportDate} hideDots />
                <EChartsLineChart.Tooltip />
              </EChartsLineChart>
            </div>
            <p className="mt-2 text-xs text-foreground-subtle">
              {latest.variacaoPct == null
                ? "Ainda sem base para comparar os dias."
                : `${latest.variacaoPct > 0 ? "+" : ""}${reportDecimal.format(latest.variacaoPct)}% em relação ao dia anterior com consulta.`}
            </p>
            <ReportDataTable
              caption="Usuários ativos por dia"
              headers={[
                "Data",
                "Usuários",
                "Variação (%)",
                "Média (7 dias com consulta)",
                "Média global",
                "Desvio padrão",
                "Z-score",
              ]}
              rows={rows.map((row) => ({
                id: row.data,
                cells: [
                  fullReportDate(row.data),
                  reportNumber.format(row.usuariosAtivos),
                  ...[
                    row.variacaoPct,
                    row.media7d,
                    row.mediaGlobal,
                    row.desvioPadrao,
                    row.zScore,
                  ].map((value) => (value == null ? "—" : reportDecimal.format(value))),
                ],
              }))}
            />
          </>
        );
      }}
    </ReportCard>
  );
}
