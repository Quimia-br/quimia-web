import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { usePersistedPreference } from "@/hooks/use-persisted-preference";

function isLayout(value: string): value is "table" | "grid" {
  return value === "table" || value === "grid";
}
const useLayout = () => usePersistedPreference("layout", "table", isLayout);

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("usePersistedPreference", () => {
  it.each([
    { saved: "grid", expected: "grid" },
    { saved: "unsupported", expected: "table" },
    { saved: "", expected: "table" },
  ])("restores only a valid saved choice ($saved)", ({ saved, expected }) => {
    localStorage.setItem("layout", saved);
    const { result } = renderHook(useLayout);
    expect(result.current[0]).toBe(expected);
  });

  it("retains a chosen preference across remounts without replacing other keys", () => {
    localStorage.setItem("theme", "dark");
    const first = renderHook(useLayout);
    act(() => first.result.current[1]("grid"));
    expect(first.result.current[0]).toBe("grid");
    expect(localStorage.getItem("layout")).toBe("grid");
    first.unmount();
    const second = renderHook(useLayout);
    expect(second.result.current[0]).toBe("grid");
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("keeps choices in memory when reads and writes are denied", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Denied", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Full", "QuotaExceededError");
    });
    const { result } = renderHook(useLayout);
    expect(result.current[0]).toBe("table");
    act(() => result.current[1]("grid"));
    expect(result.current[0]).toBe("grid");
    act(() => result.current[1]("table"));
    expect(result.current[0]).toBe("table");
  });

  it("writes subsequent selections to the current storage key", () => {
    const { result, rerender } = renderHook(
      ({ key }) => usePersistedPreference(key, "table", isLayout),
      { initialProps: { key: "layout-a" } },
    );
    act(() => result.current[1]("grid"));
    rerender({ key: "layout-b" });
    act(() => result.current[1]("table"));
    expect(localStorage.getItem("layout-a")).toBe("grid");
    expect(localStorage.getItem("layout-b")).toBe("table");
  });
});
