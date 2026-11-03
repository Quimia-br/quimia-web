import { Trophy } from "lucide-react";
import { EChartsBarChart } from "@/components/evilcharts/charts/echarts-bar-chart";
import { useTopProductsReport } from "@/hooks/use-company-reports";
import { reportNumber } from "@/lib/company-reports";
import ReportCard, { ReportDataTable } from "./ReportCard";
import { productsConfig } from "./chart-config";

export default function TopProductsReport() {
  const query = useTopProductsReport();
  return (
    <ReportCard
      title="Produtos mais consultados"
      description="Os 5 produtos com mais consultas"
      icon={Trophy}
      query={query}
      isEmpty={(rows) => rows.length === 0}
      caption="Produtos empatados compartilham a mesma posição no ranking."
    >
      {(rows) => (
        <>
          <div className="h-44" aria-hidden="true">
            <EChartsBarChart
              data={rows.map((row) => ({
                ...row,
                produto: `${row.nomeProduto}${row.nomeMarca ? ` · ${row.nomeMarca}` : ""}`,
              }))}
              config={productsConfig}
              className="h-full w-full"
              barRadius={24}
            >
              <EChartsBarChart.Bar dataKey="totalConsultas" enableHoverHighlight />
              <EChartsBarChart.XAxis
                dataKey="produto"
                tickFormatter={(name) => (name.length > 11 ? `${name.slice(0, 10)}…` : name)}
                hideDots
              />
              <EChartsBarChart.Tooltip />
            </EChartsBarChart>
          </div>
          <ReportDataTable
            caption="Ranking de produtos mais consultados"
            headers={["Posição", "Produto", "Marca", "Consultas"]}
            rows={rows.map((row) => ({
              id: row.idProduto,
              cells: [
                reportNumber.format(row.ranking),
                row.nomeProduto,
                row.nomeMarca ?? "—",
                reportNumber.format(row.totalConsultas),
              ],
            }))}
          />
        </>
      )}
    </ReportCard>
  );
}
