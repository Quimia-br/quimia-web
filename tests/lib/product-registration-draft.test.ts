import { describe, expect, it } from "vite-plus/test";
import { emptyProductDraft, restoreProductDraft } from "@/lib/product-registration-draft";
import { cleanAnalysis } from "../fixtures/fds";

describe("product draft validation", () => {
  it("restores the PDF, image, corrections and stage without serializing files as JSON", () => {
    const file = new File(["%PDF-1.7"], "fds.pdf", { type: "application/pdf" });
    const image = new File(["image"], "product.png", { type: "image/png" });
    const draft = {
      ...emptyProductDraft(),
      open: true,
      view: "success",
      fields: { nome: "Produto", tipo: "alvejante", descricao: "Descrição", codBarras: "001234" },
      image,
      fds: {
        file,
        analyzedFile: file,
        selectionAnalyzed: true,
        analysis: cleanAnalysis,
        corrections: [{ indice: 0, unidadeConcentracao: "%" }],
      },
    };
    const restored = restoreProductDraft(draft);
    expect(restored?.fds.file).toBe(file);
    expect(restored?.image).toBe(image);
    expect(restored?.fields.codBarras).toBe("001234");
    expect(restored?.view).toBe("success");
  });
  it("returns interrupted or expired analysis to a retryable upload without dropping its file", () => {
    const file = new File(["%PDF-1.7"], "fds.pdf");
    const draft = {
      ...emptyProductDraft(),
      open: true,
      view: "analyzing",
      fields: { nome: "Produto", tipo: "outro", descricao: "", codBarras: "" },
      fds: { ...emptyProductDraft().fds, file },
    };
    expect(restoreProductDraft(draft)?.view).toBe("upload");
    const expired = {
      ...draft,
      view: "success",
      fds: { ...draft.fds, analysis: { ...cleanAnalysis, expiraEm: "2000-01-01T00:00:00Z" } },
    };
    expect(restoreProductDraft(expired)?.view).toBe("upload");
    expect(restoreProductDraft(expired)?.fds.file).toBe(file);
  });
  it("ignores incompatible or corrupt drafts rather than opening a broken registration", () => {
    for (const value of [
      null,
      "{}",
      { version: 2 },
      { ...emptyProductDraft(), open: true, image: {} },
      emptyProductDraft(),
    ])
      expect(restoreProductDraft(value)).toBeNull();
  });
  it("never reuses an earlier analysis after an interrupted replacement", () => {
    const file = new File(["%PDF-1.7"], "replacement.pdf");
    const draft = {
      ...emptyProductDraft(),
      open: true,
      view: "analyzing",
      fields: { nome: "Produto", tipo: "outro", descricao: "", codBarras: "" },
      fds: {
        file,
        analyzedFile: file,
        selectionAnalyzed: false,
        analysis: cleanAnalysis,
        corrections: [],
      },
    };
    const restored = restoreProductDraft(draft);
    expect(restored?.view).toBe("upload");
    expect(restored?.fds.file).toBe(file);
    expect(restored?.fds.analysis).toBeNull();
    expect(restored?.fds.selectionAnalyzed).toBe(false);
  });
  it("does not retain a discardable analysis after an interrupted product submission", () => {
    const file = new File(["%PDF-1.7"], "fds.pdf");
    const draft = {
      ...emptyProductDraft(),
      open: true,
      view: "success",
      submissionPending: true,
      fields: { nome: "Produto", tipo: "outro", descricao: "", codBarras: "" },
      fds: {
        file,
        analyzedFile: file,
        selectionAnalyzed: true,
        analysis: cleanAnalysis,
        corrections: [],
      },
    };
    const restored = restoreProductDraft(draft);
    expect(restored?.view).toBe("upload");
    expect(restored?.fds.analysis).toBeNull();
    expect(restored?.fds.file).toBe(file);
    expect(restored?.recoveryNotice).toBe("submission");
  });
});
