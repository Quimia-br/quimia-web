import { emptyProductDraft } from "./product-registration-draft";
import type { ProductRegistrationAction, ProductRegistrationState } from "@/types/ProductRegistrationState";

/** Restore draft, readiness and recovery notice atomically; side effects stay in the hook. */
export function productRegistrationReducer(state: ProductRegistrationState, action: ProductRegistrationAction): ProductRegistrationState {
  switch (action.type) {
    case "restored": return { status: "ready", draft: action.draft, recoveryNotice: action.recoveryNotice };
    case "update": return { ...state, draft: typeof action.patch === "function" ? action.patch(state.draft) : { ...state.draft, ...action.patch } };
    case "checkpoint": return { ...state, draft: action.draft };
    case "storage-failed": return { ...state, status: "storage-error" };
    case "clear": return { status: "ready", draft: emptyProductDraft(), recoveryNotice: null };
  }
}
