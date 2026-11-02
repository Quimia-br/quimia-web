import ProductCreateDialog from "@/components/ProductCreateDialog";
import DataDisplayToggle from "@/components/DataDisplayToggle";
import ProductSearchFields from "@/components/ProductSearchFields";
import Header from "@/components/Header";
import SearchBar from "@/components/SearchBar";
import ProductsResults from "@/components/ProductsResults";
import { ToastProvider, ToastViewport } from "@/components/Toast";
import { DataDisplayProvider } from "@/lib/data-display-provider";
import { useState, type ReactNode } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { ProductCreateDialogContext } from "@/lib/product-create-dialog-context";
import ThemeToogle from "@/components/ThemeToogle";

function ProductsProviders({ children }: { children: ReactNode }) {
  // Header and empty-state actions share one registration dialog and draft.
  const [handle] = useState(() => Dialog.createHandle());
  return (
    <ToastProvider>
      <DataDisplayProvider>
        <ProductCreateDialogContext value={handle}>{children}</ProductCreateDialogContext>
      </DataDisplayProvider>
    </ToastProvider>
  );
}

function ProductActions({ filterButton }: { filterButton: ReactNode }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-6 md:gap-4">
      <div className="order-1 [&>button]:size-[50px] md:order-4 md:[&>button]:size-16">
        <ProductCreateDialog />
      </div>
      <div className="order-2 [&>button]:size-[50px] md:[&>button]:size-16">{filterButton}</div>
      <div className="order-3 [&>button]:size-[50px] md:[&>button]:size-16">
        <DataDisplayToggle />
      </div>
      <ThemeToogle className="order-4 md:hidden" />
      <SearchBar
        label="Pesquisar produto"
        className="order-5 max-w-none basis-full [&_[data-slot=input-group]]:h-[70px] md:order-1 md:max-w-[398px] md:basis-auto md:[&_[data-slot=input-group]]:h-16"
      />
      <ToastViewport
        align="end"
        label="Avisos de produtos"
        className="order-6 w-full basis-full [&>div]:w-full md:w-auto md:flex-1 md:basis-auto md:[&>div]:w-fit"
      />
    </div>
  );
}

function Products() {
  return (
    <>
      <ProductsProviders>
        <Header title="Produtos cadastrados" mobileTitle="Produtos" mobileThemeInActions />
        <ProductSearchFields
          renderActions={(filterButton) => <ProductActions filterButton={filterButton} />}
        />
        <ProductsResults />
      </ProductsProviders>
    </>
  );
}

export default Products;
