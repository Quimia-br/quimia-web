import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { initializeTheme } from "@/lib/theme-bootstrap";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.documentElement.classList.remove("light", "dark");
});

describe("theme bootstrap", () => {
  it("migrates the legacy choice before React mounts", () => {
    localStorage.setItem("quimia:theme", "dark");
    initializeTheme();
    expect(document.documentElement).toHaveClass("dark");
    expect(JSON.parse(localStorage.getItem("quimia:theme")!)).toEqual({
      _versao: 1,
      dados: "dark",
    });
  });

  it("uses the versioned preference instead of flashing the system appearance", () => {
    localStorage.setItem("quimia:theme", '{"_versao":1,"dados":"dark"}');
    initializeTheme();
    expect(document.documentElement).toHaveClass("dark");
  });

  it.each(['{"_versao":2,"dados":"dark"}', '{"_versao":1,"dados":true}', "{invalid"])(
    "discards invalid data and follows the system (%s)",
    (saved) => {
      localStorage.setItem("quimia:theme", saved);
      vi.stubGlobal("matchMedia", () => ({ matches: true }));
      initializeTheme();
      expect(document.documentElement).toHaveClass("dark");
      expect(localStorage.getItem("quimia:theme")).toBeNull();
    },
  );

  it("follows the system when storage is inaccessible", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    expect(() => initializeTheme()).not.toThrow();
    expect(document.documentElement).toHaveClass("dark");
  });
});
