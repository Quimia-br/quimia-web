import { useParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { parseProductId } from "@/lib/utils/route-params";
import { useProductDetail } from "@/hooks/use-product-detail";
import Header from "@/components/Header";
import LinkButton from "@/components/LinkButton";
import BasicButton from "@/components/BasicButton";
import ProductImage from "@/components/ProductImage";
import type { Produto } from "@/types/Produto";

function ProductContent({ product }: { product: Produto }) {
  return (
    <div className="flex flex-wrap items-start gap-8">
      <ProductImage product={product} className="h-64 w-48 rounded-3xl" />
      <div className="flex min-w-0 flex-1 flex-col gap-4 wrap-anywhere">
        <h2 className="text-3xl font-medium">{product.nome}</h2>
        <dl className="grid gap-4">
          <div>
            <dt className="font-medium">Marca</dt>
            <dd>{product.marca.nome}</dd>
          </div>
          <div>
            <dt className="font-medium">Tipo</dt>
            <dd>{product.tipo?.replaceAll("_", " ") ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="font-medium">Código de barras</dt>
            <dd>{product.codBarras ?? "Não informado"}</dd>
          </div>
          <div>
            <dt className="font-medium">Descrição</dt>
            <dd className="whitespace-pre-wrap">{product.descricao ?? "Sem descrição"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function ProductQueryState({ id }: { id: number | null }) {
  const query = useProductDetail(id);
  if (id === null)
    return <p role="alert">O endereço contém um identificador de produto inválido.</p>;
  if (query.isPending) return <p role="status">Carregando produto...</p>;
  if (query.isError) {
    const notFound = isAxiosError(query.error) && query.error.response?.status === 404;
    return (
      <div className="flex flex-col items-start gap-4">
        <p role="alert">
          {notFound ? "Produto não encontrado." : "Não foi possível carregar o produto."}
        </p>
        {!notFound && (
          <BasicButton onClick={() => void query.refetch()}>Tentar novamente</BasicButton>
        )}
      </div>
    );
  }
  return <ProductContent product={query.data} />;
}

export default function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const id = productId === undefined ? null : parseProductId(productId);
  return (
    <>
      <Header title="Detalhes do produto" />
      <section
        className="flex min-w-0 flex-1 flex-col gap-6 rounded-[40px] bg-surface-base p-6 md:p-8"
        aria-label="Detalhes do produto"
      >
        <LinkButton to="/products">Voltar para produtos</LinkButton>
        <ProductQueryState id={id} />
      </section>
    </>
  );
}
