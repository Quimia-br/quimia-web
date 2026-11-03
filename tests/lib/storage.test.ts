import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import {
  readStoredValue,
  removeStoredValue,
  writeStoredValue,
  type StorageSchema,
} from "@/utils/storage";

const schema: StorageSchema<{ enabled: boolean }> = {
  version: 1,
  parse(value) {
    if (
      typeof value !== "object" ||
      value === null ||
      !("enabled" in value) ||
      typeof value.enabled !== "boolean"
    )
      return undefined;
    return { enabled: value.enabled };
  },
  migrate(value) {
    return value === "yes" ? { enabled: true } : undefined;
  },
};
const fallback = { enabled: false };

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("versioned storage", () => {
  it("round-trips a validated payload through a versioned envelope", () => {
    writeStoredValue("setting", { enabled: true }, schema);
    expect(JSON.parse(localStorage.getItem("setting")!)).toEqual({
      _versao: 1,
      dados: { enabled: true },
    });
    expect(readStoredValue("setting", schema, fallback)).toEqual({ enabled: true });
  });

  it("migrates a recognized legacy value to the current envelope", () => {
    localStorage.setItem("setting", "yes");
    expect(readStoredValue("setting", schema, fallback)).toEqual({ enabled: true });
    expect(JSON.parse(localStorage.getItem("setting")!)).toEqual({
      _versao: 1,
      dados: { enabled: true },
    });
  });

  it.each([
    "{invalid",
    '{"_versao":2,"dados":{"enabled":true}}',
    '{"_versao":"1","dados":{"enabled":true}}',
    '{"_versao":1,"dados":{"enabled":"true"}}',
    '{"_versao":1}',
    "null",
  ])("discards corrupt or unsupported values (%s)", (saved) => {
    localStorage.setItem("setting", saved);
    expect(readStoredValue("setting", schema, fallback)).toEqual({ enabled: false });
    expect(localStorage.getItem("setting")).toBeNull();
  });

  it("never treats a future envelope as legacy input", () => {
    localStorage.setItem("setting", '{"_versao":2,"dados":"yes"}');
    const permissiveMigration = { ...schema, migrate: () => ({ enabled: true }) };
    expect(readStoredValue("setting", permissiveMigration, fallback)).toEqual({ enabled: false });
  });

  it("returns the migrated value even if storage rejects the rewrite", () => {
    localStorage.setItem("setting", "yes");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    expect(readStoredValue("setting", schema, fallback)).toEqual({ enabled: true });
  });

  it("falls back without interrupting the caller when storage access is denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(readStoredValue("setting", schema, fallback)).toEqual({ enabled: false });
    expect(() => writeStoredValue("setting", { enabled: true }, schema)).not.toThrow();
    expect(() => removeStoredValue("setting")).not.toThrow();
  });

  it("removes only the requested entry", () => {
    localStorage.setItem("setting", "yes");
    localStorage.setItem("other", "yes");
    removeStoredValue("setting");
    expect(localStorage.getItem("setting")).toBeNull();
    expect(localStorage.getItem("other")).toBe("yes");
  });
});
