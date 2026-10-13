import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import useTheme from "@/hooks/use-theme";
import ThemeToogle from "@/components/ThemeToogle";
import { ThemeProvider } from "./theme-provider";

const key = "test:theme-provider";

function ThemeReader() {
  const { theme, resolvedTheme } = useTheme();
  return <output>{theme}:{resolvedTheme}</output>;
}

function mediaPreference(initial: boolean) {
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const media = {
    get matches() { return matches; },
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  };
  vi.stubGlobal("matchMedia", () => media);
  return {
    change(next: boolean) {
      matches = next;
      act(() => listeners.forEach(listener => listener({ matches: next } as MediaQueryListEvent)));
    },
    listenerCount: () => listeners.size,
  };
}

afterEach(() => {
  localStorage.removeItem(key);
  document.documentElement.classList.remove("light", "dark");
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("ThemeProvider", () => {
  it("follows system light, dark, light and cleans up its listener", () => {
    const media = mediaPreference(false);
    const view = render(<ThemeProvider storageKey={key}><ThemeReader /><ThemeToogle /></ThemeProvider>);
    expect(screen.getByText("system:light")).toBeVisible();
    expect(document.documentElement).toHaveClass("light");
    expect(media.listenerCount()).toBe(1);
    media.change(true);
    expect(screen.getByText("system:dark")).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
    expect(screen.getByRole("button", { name: "Alternar para tema claro" })).toBeVisible();
    media.change(false);
    expect(screen.getByText("system:light")).toBeVisible();
    expect(document.documentElement).toHaveClass("light");
    view.unmount();
    expect(media.listenerCount()).toBe(0);
  });

  it("keeps an explicit choice when the system changes", async () => {
    const media = mediaPreference(false);
    render(<ThemeProvider storageKey={key}><ThemeReader /><ThemeToogle /></ThemeProvider>);
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar para tema escuro" }));
    media.change(true);
    media.change(false);
    expect(screen.getByText("dark:dark")).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
  });

  it("uses light when matchMedia is unavailable", () => {
    vi.stubGlobal("matchMedia", undefined);
    render(<ThemeProvider storageKey={key}><ThemeReader /></ThemeProvider>);
    expect(screen.getByText("system:light")).toBeVisible();
    expect(document.documentElement).toHaveClass("light");
  });

  it("rejects an invalid saved theme and uses the configured fallback", () => {
    localStorage.setItem(key, "sepia");
    render(<ThemeProvider defaultTheme="light" storageKey={key}><ThemeReader /></ThemeProvider>);
    expect(screen.getByText("light:light")).toBeVisible();
    expect(document.documentElement).toHaveClass("light");
  });

  it("still updates in memory when browser storage denies reads and writes", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("denied"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("denied"); });
    render(<ThemeProvider defaultTheme="light" storageKey={key}><ThemeReader /><ThemeToogle /></ThemeProvider>);
    expect(screen.getByText("light:light")).toBeVisible();
    await userEvent.setup().click(screen.getByRole("button", { name: "Alternar para tema escuro" }));
    expect(screen.getByText("dark:dark")).toBeVisible();
  });

  it("requires a provider", () => {
    expect(() => render(<ThemeReader />)).toThrow("useTheme must be used within a ThemeProvider");
  });
});
