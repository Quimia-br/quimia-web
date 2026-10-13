import { useMemo, useSyncExternalStore } from "react";
import type { ImageValue } from "@/types/Image";

function createPreviewStore(value: ImageValue) {
  let preview = typeof value === "string" ? value || null : null;
  return {
    getSnapshot: () => preview,
    subscribe(notify: () => void) {
      if (!(value instanceof File)) return () => {};
      const ownedUrl = URL.createObjectURL(value);
      preview = ownedUrl;
      notify();
      return () => { URL.revokeObjectURL(ownedUrl); preview = null; };
    },
  };
}

/** Subscribe to browser-managed previews without allocating resources during render. */
export function useImagePreview(value: ImageValue) {
  const store = useMemo(() => createPreviewStore(value), [value]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null);
}
