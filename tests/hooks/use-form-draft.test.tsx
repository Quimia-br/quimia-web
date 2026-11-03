import { cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { clearFormDraft, loadFormDraft, useFormDraft } from "@/hooks/use-form-draft";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("form drafts", () => {
  it("restores saved fields while retaining defaults absent from an older draft", () => {
    localStorage.setItem("signup", '{"email":"saved@example.com"}');
    expect(loadFormDraft("signup", { email: "", accepted: false })).toEqual({
      email: "saved@example.com",
      accepted: false,
    });
    expect(JSON.parse(localStorage.getItem("signup")!)).toEqual({
      _versao: 1,
      dados: { email: "saved@example.com", accepted: false },
    });
  });

  it("restricts restored fields to the fallback and never restores credentials", () => {
    localStorage.setItem(
      "signup",
      JSON.stringify({
        email: "saved@example.com",
        password: "secret",
        token: "secret",
        admin: true,
      }),
    );
    expect(loadFormDraft("signup", { email: "", password: "" })).toEqual({
      email: "saved@example.com",
      password: "",
    });
    expect(localStorage.getItem("signup")).not.toContain("secret");
    expect(localStorage.getItem("signup")).not.toContain("admin");
  });

  it("validates nested fields while preserving defaults and excluding nested credentials", () => {
    localStorage.setItem(
      "signup",
      JSON.stringify({ profile: { name: "Saved", password: "secret", admin: true } }),
    );
    expect(
      loadFormDraft("signup", { profile: { name: "", password: "", accepted: false } }),
    ).toEqual({
      profile: { name: "Saved", password: "", accepted: false },
    });
    expect(JSON.parse(localStorage.getItem("signup")!)).toEqual({
      _versao: 1,
      dados: { profile: { name: "Saved", accepted: false } },
    });
  });

  it.each([
    { email: 123 },
    { email: { value: "invalid" } },
    ["invalid"],
    { _versao: 99, dados: { email: "future@example.com" } },
    { _versao: 1, dados: { email: false } },
  ])("discards an invalid or unsupported draft (%j)", (saved) => {
    localStorage.setItem("signup", JSON.stringify(saved));
    expect(loadFormDraft("signup", { email: "" })).toEqual({ email: "" });
    expect(localStorage.getItem("signup")).toBeNull();
  });

  it.each([null, "", "{invalid"])(
    "uses defaults for a missing or unreadable draft (%s)",
    (saved) => {
      if (saved !== null) localStorage.setItem("signup", saved);
      expect(loadFormDraft("signup", { email: "", accepted: false })).toEqual({
        email: "",
        accepted: false,
      });
    },
  );

  it("loads defaults when the browser denies access to storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    expect(loadFormDraft("signup", { email: "" })).toEqual({ email: "" });
  });

  it("saves only selected fields and updates the chosen key and values", () => {
    const select = (values: { email: string; password: string }) => ({ email: values.email });
    const { rerender } = renderHook(({ key, values }) => useFormDraft(key, values, select), {
      initialProps: { key: "login", values: { email: "first@example.com", password: "secret" } },
    });
    expect(JSON.parse(localStorage.getItem("login")!)).toEqual({
      _versao: 1,
      dados: { email: "first@example.com" },
    });
    rerender({ key: "signup", values: { email: "next@example.com", password: "different" } });
    expect(JSON.parse(localStorage.getItem("signup")!)).toEqual({
      _versao: 1,
      dados: { email: "next@example.com" },
    });
    expect(JSON.parse(localStorage.getItem("login")!)).toEqual({
      _versao: 1,
      dados: { email: "first@example.com" },
    });
  });

  it("excludes credentials even when the selector accidentally returns them", () => {
    renderHook(() =>
      useFormDraft(
        "signup",
        { email: "saved@example.com", senha: "secret", recoveryCode: "secret" },
        (values) => values,
      ),
    );
    expect(JSON.parse(localStorage.getItem("signup")!)).toEqual({
      _versao: 1,
      dados: { email: "saved@example.com" },
    });
  });

  it("clears only the requested draft", () => {
    localStorage.setItem("signup", '{"email":"saved@example.com"}');
    localStorage.setItem("login", '{"email":"other@example.com"}');
    clearFormDraft("signup");
    expect(localStorage.getItem("signup")).toBeNull();
    expect(localStorage.getItem("login")).toBe('{"email":"other@example.com"}');
  });

  it("keeps the form usable when the browser rejects draft writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    expect(() =>
      renderHook(() => useFormDraft("login", { email: "saved@example.com" }, (values) => values)),
    ).not.toThrow();
  });

  it("does not interrupt an accepted submission when removing its draft is denied", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    expect(() => clearFormDraft("signup")).not.toThrow();
  });
});
