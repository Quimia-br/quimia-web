import { preferenceSchema, readStoredValue } from "@/lib/utils/storage";

/** Resolve the saved appearance before mounting React. ThemeProvider owns later changes. */
export function initializeTheme() {
  const theme = readStoredValue(
    "quimia:theme",
    preferenceSchema(
      (value): value is "light" | "dark" | "system" =>
        value === "light" || value === "dark" || value === "system",
    ),
    "system",
  );
  const systemDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(
    theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light",
  );
}
