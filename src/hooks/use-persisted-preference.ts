import { useCallback, useState } from "react";
import { preferenceSchema, readStoredValue, writeStoredValue } from "@/lib/utils/storage";

export function usePersistedPreference<T extends string>(
  storageKey: string,
  fallback: T,
  isValid: (value: string) => value is T,
) {
  const [value, setValue] = useState<T>(() =>
    readStoredValue(storageKey, preferenceSchema(isValid), fallback),
  );

  const setPreference = useCallback(
    (next: T) => {
      setValue(next);
      writeStoredValue(storageKey, next, preferenceSchema(isValid));
    },
    [storageKey, isValid],
  );

  return [value, setPreference] as const;
}
