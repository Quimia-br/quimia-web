import type { FdsAnalysis, FdsCorrection } from "./Produto";

export type ProductRegistrationView =
  | "details"
  | "upload"
  | "analyzing"
  | "review"
  | "success"
  | "replace";
export interface ProductFields {
  nome: string;
  tipo: string;
  descricao: string;
  codBarras: string;
}
export interface ProductFdsDraft {
  file: File | null;
  analyzedFile: File | null;
  selectionAnalyzed: boolean;
  analysis: FdsAnalysis | null;
  corrections: FdsCorrection[];
}
export interface ProductRegistrationDraft {
  version: 1;
  open: boolean;
  submissionPending: boolean;
  view: ProductRegistrationView;
  fields: ProductFields;
  image: File | null;
  fds: ProductFdsDraft;
}
export type UpdateProductDraft = (
  patch:
    | Partial<ProductRegistrationDraft>
    | ((draft: ProductRegistrationDraft) => ProductRegistrationDraft),
) => void;
