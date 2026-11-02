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
    expect(localStorage.getItem("login")).toBe('{"email":"first@example.com"}');
    rerender({ key: "signup", values: { email: "next@example.com", password: "different" } });
    expect(localStorage.getItem("signup")).toBe('{"email":"next@example.com"}');
    expect(localStorage.getItem("login")).toBe('{"email":"first@example.com"}');
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
