import Header from "@/components/Header";
import Card from "@/components/Card";
import EmptyState from "@/components/EmptyState";
import HomeStatistics from "@/components/HomeStatistics";
import ProductCreateDialog from "@/components/ProductCreateDialog";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PackageOpen, Plus } from "lucide-react";

function Home() {
  return (
    <>
      <Header title="Home" />
      <ToastProvider>
        <ScrollArea
          role="region"
          aria-label="Resumo da empresa"
          maskHeight={0}
          className="min-h-0 flex-1 rounded-[40px] bg-surface-base md:rounded-[60px]"
          viewportClassName="overscroll-contain p-4 md:p-8 [&>div]:block!"
        >
          <div className="@container">
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-3.5 @4xl:grid-cols-2">
              <HomeStatistics />
              <section
                aria-label="Produtos mais vendidos"
                className="flex min-w-0 flex-col gap-3.5"
              >
                <Card
                  title="Produtos mais vendidos"
                  className="min-h-96 flex-1 p-6 lg:p-8 [&_h2]:text-xl"
                >
                  <div className="flex flex-1 items-center justify-center">
                    <EmptyState
                      title="Nenhum produto para exibir ainda."
                      description="Os dados de vendas ainda não estão disponíveis. Adicione seus produtos para começar."
                      icon={<PackageOpen />}
                    />
                  </div>
                </Card>
                <ProductCreateDialog
                  trigger={
                    <Button
                      variant="ghost"
                      className="h-auto min-h-[107px] w-full justify-start gap-5 rounded-[42px] bg-background p-6 text-base whitespace-normal lg:p-8"
                    >
                      <span
                        aria-hidden="true"
                        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-surface-base"
                      >
                        <Plus />
                      </span>
                      Adicionar produto
                    </Button>
                  }
                />
              </section>
            </div>
          </div>
        </ScrollArea>
        <ToastViewport label="Avisos da Home" align="end" />
      </ToastProvider>
    </>
  );
}

export default Home;
