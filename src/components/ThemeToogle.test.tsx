import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLayoutEffect } from "react";
import { ThemeProvider } from "@/lib/theme-provider";
import type { Theme } from "@/hooks/use-theme";
import ThemeToogle from "./ThemeToogle";

const storageKey = "test:theme-toggle";

afterEach(() => {
  localStorage.removeItem(storageKey);
  document.documentElement.classList.remove("light", "dark");
  vi.unstubAllGlobals();
});

describe("ThemeToogle", () => {
  it("reconciles a system change between render and subscription", () => {
    let dark = false;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    vi.stubGlobal("matchMedia", () => ({
      get matches() { return dark; },
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    }));

    function ChangeBeforeSubscription() {
      useLayoutEffect(() => { dark = true; }, []);
      return <ThemeToogle />;
    }

    const view = render(
      <ThemeProvider storageKey={storageKey}>
        <ChangeBeforeSubscription />
      </ThemeProvider>,
    );

    expect(screen.getByRole("button", { name: "Alternar para tema claro" })).toBeVisible();
    expect(document.documentElement).toHaveClass("dark");
    view.unmount();
    expect(listeners.size).toBe(0);
  });

  it.each([
    ["light", false, "Alternar para tema escuro", "dark"],
    ["dark", false, "Alternar para tema claro", "light"],
    ["system", true, "Alternar para tema claro", "light"],
    ["system", false, "Alternar para tema escuro", "dark"],
  ] as const)("toggles from %s with system dark=%s and persists the selected theme", async (theme: Theme, systemDark, label, target) => {
    vi.stubGlobal("matchMedia", () => ({ matches: systemDark }));
    const user = userEvent.setup();
    render(
      <ThemeProvider defaultTheme={theme} storageKey={storageKey}>
        <ThemeToogle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: label });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard("{Enter}");

    expect(localStorage.getItem(storageKey)).toBe(target);
    expect(document.documentElement).toHaveClass(target);
    expect(button).toHaveAccessibleName(target === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro");
    expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
