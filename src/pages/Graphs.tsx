import Header from "@/components/Header";
import { useId, useState } from "react";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { SearchX } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import FilterButton from "@/components/FilterButton";
import Chip from "@/components/Chip";
import EmptyState from "@/components/EmptyState";
import BasicButton from "@/components/BasicButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import DauReport from "@/components/reports/DauReport";
import RecommendationsReport from "@/components/reports/RecommendationsReport";
import TopProductsReport from "@/components/reports/TopProductsReport";
import UserProfileReport from "@/components/reports/UserProfileReport";
import ShelvedProductsReport from "@/components/reports/ShelvedProductsReport";
import MixtureSuccessReport from "@/components/reports/MixtureSuccessReport";
import { matchesReport } from "@/lib/company-reports";

const reportTypes = ["todos", "linha", "barras", "numero", "rosca"] as const;
const typeLabels = {
  todos: "Todos",
  linha: "Linhas",
  barras: "Barras",
  numero: "Indicadores",
  rosca: "Roscas",
};
const reports = [
  { id: "dau", title: "Usuários ativos", type: "linha", Component: DauReport },
  {
    id: "estantes",
    title: "Produtos em estantes",
    type: "numero",
    Component: ShelvedProductsReport,
  },
  { id: "top", title: "Produtos mais consultados", type: "barras", Component: TopProductsReport },
  { id: "perfil", title: "Perfil dos usuários", type: "barras", Component: UserProfileReport },
  {
    id: "misturas",
    title: "Taxa de sucesso das misturas",
    type: "rosca",
    Component: MixtureSuccessReport,
  },
  {
    id: "recomendacoes",
    title: "Consultas aos produtos",
    type: "linha",
    Component: RecommendationsReport,
  },
];

function Graphs() {
  const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
  const [type, setType] = useQueryState(
    "tipo",
    parseAsStringLiteral(reportTypes).withDefault("todos"),
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterId = useId();
  const filtered = reports.filter(
    (report) => matchesReport(report.title, query) && (type === "todos" || report.type === type),
  );
  const fullLayout = filtered.length === reports.length;
  return (
    <>
      <Header title="Estatísticas" />
      <div className="flex shrink-0 flex-wrap items-center gap-[18px]">
        <SearchBar
          label="Pesquisar por título do gráfico"
          placeholder="Pesquise por título do gráfico"
          className="w-full sm:w-[398px]"
        />
        <FilterButton
          title="Filtros de estatísticas"
          aria-expanded={filtersOpen}
          aria-controls={filtersOpen ? filterId : undefined}
          onClick={() => setFiltersOpen((open) => !open)}
        />
        {type !== "todos" && !filtersOpen && <span className="text-sm">{typeLabels[type]}</span>}
      </div>
      {filtersOpen && (
        <div
          id={filterId}
          role="group"
          aria-label="Tipo de gráfico"
          className="flex shrink-0 flex-wrap gap-3"
        >
          {reportTypes.map((value) => (
            <Chip key={value} pressed={type === value} onPressedChange={() => void setType(value)}>
              {typeLabels[value]}
            </Chip>
          ))}
        </div>
      )}
      <ScrollArea
        role="region"
        aria-label="Relatórios da empresa"
        maskHeight={0}
        className="min-h-0 flex-1 rounded-[40px] bg-surface-base md:rounded-[60px]"
        viewportClassName="overscroll-contain p-4 md:p-8 [&>div]:block!"
      >
        {filtered.length ? (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map(({ id, Component }) => (
              <div
                key={id}
                className={`min-w-0 ${fullLayout && id === "misturas" ? "xl:col-span-2" : ""} ${fullLayout && id === "recomendacoes" ? "lg:col-span-2 xl:col-span-3" : ""}`}
              >
                <Component />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Nenhum relatório encontrado"
            description="Tente outro título ou altere o tipo de gráfico selecionado."
            icon={<SearchX />}
            action={
              <BasicButton
                size="compact"
                variant="secondary"
                onClick={() => {
                  void setQuery(null);
                  void setType(null);
                }}
              >
                Limpar filtros
              </BasicButton>
            }
          />
        )}
      </ScrollArea>
    </>
  );
}

export default Graphs;
