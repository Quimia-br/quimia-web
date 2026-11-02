import { lazy, Suspense } from "react";
import Header from "@/components/Header";
import ChartSkeleton from "@/components/skeletons/ChartSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

const Graphs = lazy(() => import("./Graphs"));
const loadingReports = [
  "usuários ativos",
  "produtos em estantes",
  "produtos mais consultados",
  "perfil dos usuários",
  "taxa de sucesso das misturas",
  "consultas aos produtos",
];

function GraphsFallback() {
  return (
    <>
      <Header title="Estatísticas" />
      <div aria-hidden="true" className="flex shrink-0 gap-[18px]">
        <Skeleton className="h-16 w-full max-w-[398px] rounded-full motion-reduce:animate-none" />
        <Skeleton className="size-16 shrink-0 rounded-full motion-reduce:animate-none" />
      </div>
      <section
        aria-label="Carregando relatórios da empresa"
        aria-busy="true"
        className="min-h-0 flex-1 overflow-auto rounded-[40px] bg-surface-base p-4 md:rounded-[60px] md:p-8"
      >
        <div className="grid min-w-0 grid-cols-1 items-stretch gap-3.5 lg:grid-cols-2 xl:grid-cols-3">
          {loadingReports.map((title, index) => (
            <div
              key={title}
              className={`min-w-0 ${index === 4 ? "xl:col-span-2" : ""} ${index === 5 ? "lg:col-span-2 xl:col-span-3" : ""}`}
            >
              <ChartSkeleton
                label={`Carregando ${title}`}
                className="h-full min-h-[322px]"
                contentClassName="h-40"
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export default function GraphsRoute() {
  return (
    <Suspense fallback={<GraphsFallback />}>
      <Graphs />
    </Suspense>
  );
}
