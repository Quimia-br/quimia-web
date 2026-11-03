/** Every browser-storage read is untrusted until the payload schema accepts it. */
export interface StorageSchema<T> {
  version: number;
  parse: (value: unknown) => T | undefined;
  migrate?: (legacy: unknown) => T | undefined;
}

export function isStorageRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function removeStoredValue(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Cleanup must not prevent the caller from continuing in memory.
  }
}

export function writeStoredValue<T>(key: string, value: T, schema: StorageSchema<T>): void {
  try {
    const data = schema.parse(value);
    if (data === undefined) return;
    localStorage.setItem(key, JSON.stringify({ _versao: schema.version, dados: data }));
  } catch {
    // Quota, serialization and privacy restrictions leave React state usable.
  }
}

export function readStoredValue<T>(key: string, schema: StorageSchema<T>, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return fallback;
    let decoded: unknown;
    try {
      decoded = JSON.parse(saved) as unknown;
    } catch {
      // Earlier string preferences were stored without JSON encoding.
      decoded = saved;
    }
    if (isStorageRecord(decoded) && Object.hasOwn(decoded, "_versao")) {
      if (decoded._versao === schema.version) {
        const value = schema.parse(decoded.dados);
        if (value !== undefined) return value;
      }
    } else {
      const migrated = schema.migrate?.(decoded);
      if (migrated !== undefined) {
        const value = schema.parse(migrated);
        if (value !== undefined) {
          writeStoredValue(key, value, schema);
          return value;
        }
      }
    }
    removeStoredValue(key);
  } catch {
    // Access restrictions and malformed payloads must not block initialization.
  }
  return fallback;
}

export function preferenceSchema<T extends string>(
  isValid: (value: string) => value is T,
): StorageSchema<T> {
  const parse = (value: unknown): T | undefined =>
    typeof value === "string" && isValid(value) ? value : undefined;
  return { version: 1, parse, migrate: parse };
}
