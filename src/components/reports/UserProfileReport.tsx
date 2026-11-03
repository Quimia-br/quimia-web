import { MapPin } from "lucide-react";
import { EChartsBarChart } from "@/components/evilcharts/charts/echarts-bar-chart";
import { useUserProfileReport } from "@/hooks/use-company-reports";
import { aggregateUserStates, reportNumber } from "@/lib/company-reports";
import ReportCard, { ReportDataTable } from "./ReportCard";
import { profileConfig } from "./chart-config";

export default function UserProfileReport() {
  const query = useUserProfileReport();
  return (
    <ReportCard
      title="Perfil dos usuários"
      description="Quem consulta seus produtos, por estado"
      icon={MapPin}
      query={query}
      isEmpty={(rows) => rows.length === 0}
      caption="Os 5 estados com mais usuários. A tabela inclui todos os estados e níveis de acesso."
    >
      {(rows) => (
        <>
          <div className="h-52" aria-hidden="true">
            <EChartsBarChart
              data={aggregateUserStates(rows).slice(0, 5)}
              config={profileConfig}
              className="h-full w-full"
              barRadius={24}
            >
              <EChartsBarChart.Bar dataKey="totalUsuarios" enableHoverHighlight />
              <EChartsBarChart.XAxis
                dataKey="estado"
                tickFormatter={(state) => (state === "Não informado" ? "N/I" : state)}
                hideDots
              />
              <EChartsBarChart.Tooltip />
            </EChartsBarChart>
          </div>
          <ReportDataTable
            caption="Usuários por estado e nível de acesso"
            headers={["Estado", "Nível de acesso", "Usuários"]}
            rows={rows.map((row) => ({
              id: JSON.stringify([row.estado, row.nivelAcesso]),
              cells: [
                row.estado === "NI" ? "Não informado" : row.estado,
                row.nivelAcesso,
                reportNumber.format(row.totalUsuarios),
              ],
            }))}
          />
        </>
      )}
    </ReportCard>
  );
}
