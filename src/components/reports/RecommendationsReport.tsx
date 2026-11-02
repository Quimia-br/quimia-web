import { MessageCircleQuestionMark } from "lucide-react";
import { EChartsLineChart } from "@/components/evilcharts/charts/echarts-line-chart";
import { useRecommendationsReport } from "@/hooks/use-company-reports";
import { formatReportDate, fullReportDate, reportNumber } from "@/lib/company-reports";
import ReportCard, { ReportDataTable } from "./ReportCard";
import { recommendationsConfig } from "./chart-config";

export default function RecommendationsReport() {
  const query = useRecommendationsReport();
  return (
    <ReportCard
      title="Consultas aos produtos"
      description="Consultas e usuários distintos por dia"
      icon={MessageCircleQuestionMark}
      query={query}
      isEmpty={(rows) => rows.length === 0}
      caption="O mesmo usuário pode aparecer em dias diferentes. Dias sem registro não são preenchidos com estimativas."
    >
      {(rows) => (
        <>
          <p className="mb-4 text-sm">
            <span className="text-3xl font-medium tabular-nums">
              {reportNumber.format(rows.reduce((sum, row) => sum + row.totalConsultas, 0))}
            </span>{" "}
            consultas de {fullReportDate(rows[0].data)} a {fullReportDate(rows.at(-1)!.data)}
          </p>
          <div className="h-52" aria-hidden="true">
            <EChartsLineChart
              data={rows}
              config={recommendationsConfig}
              className="h-full w-full"
              curveType="linear"
              enableHoverHighlight
            >
              <EChartsLineChart.Line dataKey="totalConsultas" strokeWidth={2}>
                <EChartsLineChart.Dot />
                <EChartsLineChart.ActiveDot />
              </EChartsLineChart.Line>
              <EChartsLineChart.Line dataKey="usuariosDistintos" strokeWidth={2}>
                <EChartsLineChart.Dot />
                <EChartsLineChart.ActiveDot />
              </EChartsLineChart.Line>
              <EChartsLineChart.XAxis dataKey="data" tickFormatter={formatReportDate} hideDots />
              <EChartsLineChart.YAxis
                hideDots
                tickFormatter={(value) =>
                  Number.isInteger(value) ? reportNumber.format(value) : ""
                }
              />
              <EChartsLineChart.Tooltip />
              <EChartsLineChart.Legend isClickable={false} />
            </EChartsLineChart>
          </div>
          <ReportDataTable
            caption="Consultas e usuários por dia"
            headers={["Data", "Consultas", "Usuários distintos no dia"]}
            rows={rows.map((row) => [
              fullReportDate(row.data),
              reportNumber.format(row.totalConsultas),
              reportNumber.format(row.usuariosDistintos),
            ])}
          />
        </>
      )}
    </ReportCard>
  );
}
