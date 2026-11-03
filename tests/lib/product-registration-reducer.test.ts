import { describe, expect, it } from "vite-plus/test";
import { productRegistrationReducer } from "@/lib/product-registration-reducer";
import { emptyProductDraft } from "@/lib/product-registration-draft";

describe("product registration state transitions", () => {
  it("merges field patches immutably and preserves unrelated FDS data", () => {
    const draft = emptyProductDraft();
    const state = { status: "ready" as const, draft, recoveryNotice: null };
    const next = productRegistrationReducer(state, { type: "update", patch: current => ({ ...current, fields: { ...current.fields, nome: "Novo" } }) });
    expect(next.draft.fields.nome).toBe("Novo");
    expect(state.draft.fields.nome).toBe("");
    expect(next.draft.fds).toBe(draft.fds);
  });

  it("keeps recovery notice and readiness consistent when restoring a pending submission", () => {
    const state = { status: "loading" as const, draft: emptyProductDraft(), recoveryNotice: null };
    const restored = { ...emptyProductDraft(), open: true };
    const next = productRegistrationReducer(state, { type: "restored", draft: restored, recoveryNotice: "submission" });
    expect(next.status).toBe("ready");
    expect(next.recoveryNotice).toBe("submission");
    expect(productRegistrationReducer(next, { type: "clear" })).toEqual({ status: "ready", draft: emptyProductDraft(), recoveryNotice: null });
  });
});
