import { Library } from "lucide-react";
import { useStatisticsReport } from "@/hooks/use-company-reports";
import { reportNumber } from "@/lib/company-reports";
import ReportCard from "./ReportCard";

export default function ShelvedProductsReport() {
  const query = useStatisticsReport();
  return (
    <ReportCard
      title="Produtos em estantes"
      description="Seus produtos nas estantes dos usuários"
      icon={Library}
      query={query}
      isEmpty={(data) =>
        !data.cards.some((card) => card.id === "produtos_em_estantes" && card.tipo === "numero")
      }
      caption="Vezes que os produtos da empresa foram guardados. Um produto pode estar em várias estantes."
    >
      {(data) => {
        const card = data.cards.find((item) => item.id === "produtos_em_estantes");
        return (
          <div className="flex min-h-44 items-center justify-center">
            <p
              className="text-5xl font-medium tabular-nums"
              aria-label={`${reportNumber.format(card?.valor ?? 0)} produtos em estantes`}
            >
              {reportNumber.format(card?.valor ?? 0)}
            </p>
          </div>
        );
      }}
    </ReportCard>
  );
}
