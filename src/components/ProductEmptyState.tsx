import EmptyState from "./EmptyState";
import { DialogTrigger } from "./ui/dialog";
import { useProductCreateDialogHandle } from "@/lib/product-create-dialog-context";
import BasicButton from "./BasicButton";
import { TriangleAlert } from "lucide-react";

function ProductEmptyState() {
  const handle = useProductCreateDialogHandle();
  return (
    <EmptyState
      className="min-h-[285px] py-0"
      icon={<TriangleAlert />}
      title="Nenhum produto foi adicionado ainda."
      description="Adicione produtos da sua marca e eles aparecerão aqui."
      action={
        <DialogTrigger
          handle={handle}
          render={
            <BasicButton variant="secondary" size="compact" className="min-h-[51px] px-5 py-4 ">
              Adicionar produto
            </BasicButton>
          }
        />
      }
    />
  );
}

export default ProductEmptyState;
