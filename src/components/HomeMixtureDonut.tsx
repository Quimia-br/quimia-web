import { EChartsPieChart } from "@/components/evilcharts/charts/echarts-pie-chart";
import { mixturesConfig } from "@/components/reports/chart-config";

export default function HomeMixtureDonut({
  data,
}: {
  data: { resultado: string; valor: number }[];
}) {
  return (
    <EChartsPieChart
      data={data}
      config={mixturesConfig}
      dataKey="valor"
      nameKey="resultado"
      className="h-full w-full"
    >
      <EChartsPieChart.Pie
        innerRadius="55%"
        outerRadius="90%"
        paddingAngle={0}
        isClickable={false}
      />
      <EChartsPieChart.Tooltip />
    </EChartsPieChart>
  );
}
