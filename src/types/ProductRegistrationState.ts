import type { ProductRegistrationDraft, UpdateProductDraft } from "./ProductRegistration";

interface RegistrationData {
  draft: ProductRegistrationDraft;
  recoveryNotice: "submission" | null;
}
export type ProductRegistrationState =
  | (RegistrationData & { status: "loading" })
  | (RegistrationData & { status: "ready" })
  | (RegistrationData & { status: "storage-error" });
export type ProductRegistrationAction =
  | { type: "restored"; draft: ProductRegistrationDraft; recoveryNotice: "submission" | null }
  | { type: "update"; patch: Parameters<UpdateProductDraft>[0] }
  | { type: "checkpoint"; draft: ProductRegistrationDraft }
  | { type: "storage-failed" }
  | { type: "clear" };
