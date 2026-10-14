import { useCallback, useState } from "react";

export function usePersistedPreference<T extends string>(
  storageKey: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved !== null && isValid(saved) ? saved : fallback;
    } catch {
      return fallback;
    }
  });

  const setPreference = useCallback((next: T) => {
    setValue(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch {
      // Keep the current choice in memory when storage is unavailable.
    }
  }, [storageKey]);

  return [value, setPreference] as const;
}
