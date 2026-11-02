import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import { AccessibilityProvider } from "@/lib/accessibility-provider";
import { useAccessibility } from "@/hooks/use-accessibility";
import { initializeAccessibility } from "@/lib/accessibility";

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-dyslexic");
  document.documentElement.removeAttribute("data-text-scale");
  document.documentElement.style.removeProperty("font-size");
  vi.restoreAllMocks();
});

describe("global accessibility preferences", () => {
  it("restores legacy preferences without starting the camera and resets assistive tools", () => {
    localStorage.setItem(
      "quimia:accessibility",
      JSON.stringify({ version: 1, textScale: 150, dyslexicFont: true }),
    );
    const { result, unmount } = renderHook(useAccessibility, { wrapper: AccessibilityProvider });
    expect(result.current).toMatchObject({
      textScale: 150,
      vlibrasEnabled: false,
      gazeEnabled: false,
    });
    act(() => result.current.setVlibrasEnabled(true));
    act(() => result.current.setGazeEnabled(true));
    unmount();
    const restored = renderHook(useAccessibility, { wrapper: AccessibilityProvider });
    expect(restored.result.current).toMatchObject({ vlibrasEnabled: true, gazeEnabled: false });
    act(() => restored.result.current.reset());
    expect(restored.result.current).toMatchObject({ vlibrasEnabled: false, gazeEnabled: false });
  });

  it("applies and persists both preferences independently of the session", () => {
    const { result, unmount } = renderHook(useAccessibility, { wrapper: AccessibilityProvider });
    expect(result.current.textScale).toBe(100);
    act(() => result.current.setTextScale(200));
    act(() => result.current.setDyslexicFont(true));
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "true");
    expect(
      getComputedStyle(document.documentElement).getPropertyValue("--app-font-family"),
    ).toContain("OpenDyslexic");
    expect(document.documentElement.style.fontSize).toBe("200%");
    unmount();
    const restored = renderHook(useAccessibility, { wrapper: AccessibilityProvider });
    expect(restored.result.current).toMatchObject({ textScale: 200, dyslexicFont: true });
    act(() => restored.result.current.reset());
    expect(restored.result.current).toMatchObject({ textScale: 100, dyslexicFont: false });
    expect(document.documentElement.style.fontSize).toBe("100%");
  });

  it("restores preferences before React mounts and rejects invalid stored values", () => {
    localStorage.setItem(
      "quimia:accessibility",
      JSON.stringify({ version: 1, textScale: 150, dyslexicFont: true }),
    );
    initializeAccessibility();
    expect(document.documentElement.style.fontSize).toBe("150%");
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "true");
    localStorage.setItem(
      "quimia:accessibility",
      JSON.stringify({ version: 1, textScale: 900, dyslexicFont: "yes" }),
    );
    initializeAccessibility();
    expect(document.documentElement.style.fontSize).toBe("100%");
    expect(document.documentElement).toHaveAttribute("data-dyslexic", "false");
  });

  it("continues in memory when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(useAccessibility, { wrapper: AccessibilityProvider });
    act(() => result.current.setTextScale(125));
    expect(result.current.textScale).toBe(125);
    expect(document.documentElement.style.fontSize).toBe("125%");
  });
});
