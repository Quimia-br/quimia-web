import { cn } from "cn";
import { PackageOpen } from "lucide-react";
import { useState } from "react";
import type { Produto } from "@/types/Produto";

interface ProductImageProps {
  product: Pick<Produto, "nome" | "fotoUrl">;
  className?: string;
}

function ProductImage({ product, className }: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const { fotoUrl, nome } = product;

  return (
    <div className={cn("flex min-w-0 items-center justify-center", className)}>
      {fotoUrl && failedUrl !== fotoUrl ? (
        <img
          src={fotoUrl}
          alt=""
          loading="lazy"
          onError={() => setFailedUrl(fotoUrl)}
          className="size-full object-contain object-left-bottom"
        />
      ) : (
        <span
          role="img"
          aria-label={`Imagem indisponível de ${nome}`}
          className="flex size-full items-center justify-center text-muted-foreground"
        >
          <PackageOpen className="size-8" aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

export default ProductImage;
