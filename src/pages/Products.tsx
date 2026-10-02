import MainTitle from "@/components/MainTitle";
import ThemeToogle from "@/components/ThemeToogle";

function Products() {
  return (
    <>
      <header className="flex items-center px-4">
        <MainTitle className="flex-1" title="Produtos cadastrados" />
        <ThemeToogle />
      </header>
    </>
  );
}

export default Products;
