// src/hooks/use-form-draft.ts
import { useEffect } from "react";

export function loadFormDraft<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

export function useFormDraft<T>(key: string, values: T, selectDraft: (values: T) => Partial<T>) {
  useEffect(() => {
    const draft = JSON.stringify(selectDraft(values));
    try {
      localStorage.setItem(key, draft);
    } catch {
      // Saving a draft is optional when storage is full or unavailable.
    }
  }, [key, values, selectDraft]);
}

export function clearFormDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // A rejected cleanup must not turn a successful submission into a failure.
  }
}
