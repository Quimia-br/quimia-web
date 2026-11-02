import { createContext, useContext } from "react";
import type { Dialog } from "@base-ui/react/dialog";

export const ProductCreateDialogContext = createContext<
  ReturnType<typeof Dialog.createHandle> | undefined
>(undefined);

export function useProductCreateDialogHandle() {
  return useContext(ProductCreateDialogContext);
}
