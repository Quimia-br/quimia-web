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

export function useFormDraft<T>(
  key: string,
  values: T,
  selectDraft: (values: T) => Partial<T>,
) {
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(selectDraft(values)));
  }, [key, values, selectDraft]);
}

export function clearFormDraft(key: string) {
  localStorage.removeItem(key);
}
