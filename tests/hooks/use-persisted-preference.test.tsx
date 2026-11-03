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
    expect(JSON.parse(localStorage.getItem("layout")!)).toEqual({ _versao: 1, dados: "grid" });
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
    expect(JSON.parse(localStorage.getItem("layout-a")!)).toEqual({ _versao: 1, dados: "grid" });
    expect(JSON.parse(localStorage.getItem("layout-b")!)).toEqual({ _versao: 1, dados: "table" });
  });

  it("migrates a known legacy choice and restores the versioned value on remount", () => {
    localStorage.setItem("layout", "grid");
    const view = renderHook(useLayout);
    expect(view.result.current[0]).toBe("grid");
    expect(JSON.parse(localStorage.getItem("layout")!)).toEqual({ _versao: 1, dados: "grid" });
    view.unmount();
    expect(renderHook(useLayout).result.current[0]).toBe("grid");
  });

  it.each(['{"_versao":2,"dados":"grid"}', '{"_versao":1,"dados":false}', "{invalid"])(
    "discards unsupported or malformed data (%s)",
    (saved) => {
      localStorage.setItem("layout", saved);
      expect(renderHook(useLayout).result.current[0]).toBe("table");
      expect(localStorage.getItem("layout")).toBeNull();
    },
  );
});
