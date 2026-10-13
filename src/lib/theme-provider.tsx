import { ThemeProviderContext, type Theme } from "@/hooks/use-theme";
import { usePersistedPreference } from "@/hooks/use-persisted-preference";
import { useEffect, useSyncExternalStore } from "react";

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

const isTheme = (value: string): value is Theme =>
  value === "light" || value === "dark" || value === "system";

const systemThemeQuery = "(prefers-color-scheme: dark)";

const prefersDark = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia(systemThemeQuery).matches;

const subscribeToSystemTheme = (onChange: () => void) => {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(systemThemeQuery);
  media.addEventListener?.("change", onChange);
  return () => media.removeEventListener?.("change", onChange);
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "quimia:theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = usePersistedPreference(storageKey, defaultTheme, isTheme);
  const systemDark = useSyncExternalStore(subscribeToSystemTheme, prefersDark, () => false);
  const resolvedTheme = theme === "system" ? (systemDark ? "dark" : "light") : theme;

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    root.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const value = { theme, resolvedTheme, setTheme }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}
