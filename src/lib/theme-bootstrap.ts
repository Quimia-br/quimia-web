/** Resolve the saved appearance before mounting React. ThemeProvider owns later changes. */
export function initializeTheme() {
  let theme = "system";
  try {
    const saved = localStorage.getItem("quimia:theme");
    if (saved === "light" || saved === "dark") theme = saved;
  } catch {
    // Follow the operating system when browser storage is unavailable.
  }
  const systemDark =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(
    theme === "dark" || (theme === "system" && systemDark) ? "dark" : "light",
  );
}
