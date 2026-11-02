import { z } from "zod";
import { concentrationUnitSchema, fdsAnalysisSchema } from "./fds-analysis";
import type { ProductRegistrationDraft } from "@/types/ProductRegistration";

export function emptyProductDraft(): ProductRegistrationDraft {
  return {
    version: 1,
    open: false,
    submissionPending: false,
    view: "details",
    fields: { nome: "", tipo: "", descricao: "", codBarras: "" },
    image: null,
    fds: {
      file: null,
      analyzedFile: null,
      selectionAnalyzed: false,
      analysis: null,
      corrections: [],
    },
  };
}
const pdf = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024)
  .nullable();
const schema = z.object({
  version: z.literal(1),
  open: z.boolean(),
  submissionPending: z.boolean().default(false),
  view: z.enum(["details", "upload", "analyzing", "review", "success", "replace"]),
  fields: z.object({
    nome: z.string().max(255),
    tipo: z.string().max(50),
    descricao: z.string().max(4000),
    codBarras: z.string().max(255),
  }),
  image: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024)
    .nullable(),
  fds: z.object({
    file: pdf,
    analyzedFile: pdf,
    selectionAnalyzed: z.boolean(),
    analysis: fdsAnalysisSchema.nullable(),
    corrections: z.array(
      z.object({
        indice: z.number().int().nonnegative(),
        unidadeConcentracao: concentrationUnitSchema,
      }),
    ),
  }),
});
export function restoreProductDraft(
  value: unknown,
): (ProductRegistrationDraft & { recoveryNotice?: "submission" }) | null {
  const parsed = schema.safeParse(value);
  if (!parsed.success || !parsed.data.open) return null;
  const draft: ProductRegistrationDraft & { recoveryNotice?: "submission" } = parsed.data;
  // An HTTP request cannot survive a page reload. Keep its file and return to a retryable stage.
  if (draft.view === "analyzing" || draft.submissionPending) {
    // The server may have replaced or registered the PDF before the response was lost.
    // Never reuse or discard that identifier from a recovered session.
    if (draft.submissionPending) draft.recoveryNotice = "submission";
    draft.submissionPending = false;
    draft.view = "upload";
    draft.fds = {
      ...draft.fds,
      analysis: null,
      analyzedFile: null,
      selectionAnalyzed: false,
      corrections: [],
    };
  }
  if ((draft.view === "review" || draft.view === "success") && !draft.fds.analysis)
    draft.view = "upload";
  if (
    draft.fds.analysis &&
    Date.parse(draft.fds.analysis.expiraEm) <= Date.now() &&
    draft.view !== "details"
  )
    draft.view = "upload";
  if (draft.view !== "details" && (!draft.fields.nome.trim() || !draft.fields.tipo.trim()))
    draft.view = "details";
  return draft;
}

const DATABASE = "quimia:product-registration";
const STORE = "drafts";
let queue: Promise<unknown> = Promise.resolve();
function ordered<T>(operation: () => Promise<T>): Promise<T> {
  const next = queue.then(operation, operation);
  queue = next.catch(() => {});
  return next;
}
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("draft_storage_unavailable"));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("draft_storage_blocked"));
  });
}
async function transaction<T>(
  ownerId: number,
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore, key: string) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE), `company:${ownerId}`);
    tx.oncomplete = () => {
      database.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      database.close();
      reject(tx.error ?? request.error);
    };
    tx.onabort = () => {
      database.close();
      reject(tx.error ?? new Error("draft_storage_aborted"));
    };
  });
}
export function loadProductDraft(ownerId: number) {
  return ordered(async () =>
    restoreProductDraft(await transaction(ownerId, "readonly", (store, key) => store.get(key))),
  );
}
export function saveProductDraft(ownerId: number, draft: ProductRegistrationDraft) {
  return ordered(() => transaction(ownerId, "readwrite", (store, key) => store.put(draft, key)));
}
export function clearProductDraft(ownerId: number) {
  return ordered(() => transaction(ownerId, "readwrite", (store, key) => store.delete(key)));
}
