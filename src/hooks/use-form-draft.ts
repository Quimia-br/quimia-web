import { useEffect } from "react";
import {
  isStorageRecord,
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
  type StorageSchema,
} from "@/lib/utils/storage";

// Selectors are an allowlist; credential names are also excluded defensively.
const privateField = /password|senha|token|recovery|recupera|__proto__|^constructor$|^prototype$/i;

function draftFields(
  value: unknown,
  fallback: unknown,
  fillDefaults: boolean,
): Record<string, unknown> | undefined {
  if (!isStorageRecord(value) || !isStorageRecord(fallback)) return undefined;
  const fields: [string, unknown][] = [];
  for (const [key, defaultValue] of Object.entries(fallback)) {
    if (privateField.test(key)) continue;
    if (!Object.hasOwn(value, key)) {
      if (fillDefaults) {
        const safeDefault = isStorageRecord(defaultValue)
          ? draftFields({}, defaultValue, true)
          : defaultValue;
        fields.push([key, safeDefault]);
      }
      continue;
    }
    const field = value[key];
    if (isStorageRecord(defaultValue)) {
      const nested = draftFields(field, defaultValue, fillDefaults);
      if (nested === undefined) return undefined;
      fields.push([key, nested]);
    } else if (
      (defaultValue === null && field === null) ||
      (typeof defaultValue === "string" && typeof field === "string") ||
      (typeof defaultValue === "boolean" && typeof field === "boolean") ||
      (typeof defaultValue === "number" && typeof field === "number" && Number.isFinite(field))
    ) {
      fields.push([key, field]);
    } else {
      // A fallback cannot describe the element schema of an arbitrary array.
      return undefined;
    }
  }
  return Object.fromEntries(fields);
}

function draftSchema(fallback: unknown): StorageSchema<Record<string, unknown>> {
  const parse = (value: unknown) => draftFields(value, fallback, true);
  return { version: 1, parse, migrate: parse };
}

function mergeDraftDefaults(
  fallback: Record<string, unknown>,
  saved: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fallback).map(([key, defaultValue]) => {
      const value = saved[key];
      return [
        key,
        isStorageRecord(defaultValue) && isStorageRecord(value)
          ? mergeDraftDefaults(defaultValue, value)
          : Object.hasOwn(saved, key)
            ? value
            : defaultValue,
      ];
    }),
  );
}

export function loadFormDraft<T>(key: string, fallback: T): T {
  if (!isStorageRecord(fallback)) return fallback;
  const saved = readStoredValue(key, draftSchema(fallback), {});
  // Only fallback keys with validated values reach this recursive merge.
  return mergeDraftDefaults(fallback, saved) as T;
}

export function useFormDraft<T>(key: string, values: T, selectDraft: (values: T) => Partial<T>) {
  useEffect(() => {
    const draft = draftFields(selectDraft(values), values, false);
    if (draft !== undefined) writeStoredValue(key, draft, draftSchema(draft));
  }, [key, values, selectDraft]);
}

export function clearFormDraft(key: string) {
  removeStoredValue(key);
}
