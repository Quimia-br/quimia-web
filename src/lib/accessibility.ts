export const TEXT_SCALES = [100, 125, 150, 175, 200] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
export interface AccessibilityPreferences {
  version: 1;
  dyslexicFont: boolean;
  textScale: TextScale;
  vlibrasEnabled: boolean;
}
export const ACCESSIBILITY_KEY = "quimia:accessibility";
export const DEFAULT_ACCESSIBILITY: AccessibilityPreferences = {
  version: 1,
  dyslexicFont: false,
  textScale: 100,
  vlibrasEnabled: false,
};

export function readAccessibility(): AccessibilityPreferences {
  try {
    const value = JSON.parse(localStorage.getItem(ACCESSIBILITY_KEY) ?? "null");
    if (
      value?.version === 1 &&
      typeof value.dyslexicFont === "boolean" &&
      TEXT_SCALES.includes(value.textScale)
    ) {
      return {
        version: 1,
        dyslexicFont: value.dyslexicFont,
        textScale: value.textScale,
        vlibrasEnabled: value.vlibrasEnabled === true,
      };
    }
  } catch {
    // Preferences remain usable when storage is unavailable or malformed.
  }
  return { ...DEFAULT_ACCESSIBILITY };
}

export function applyAccessibility(preferences: AccessibilityPreferences) {
  const root = document.documentElement;
  root.dataset.dyslexic = String(preferences.dyslexicFont);
  root.dataset.textScale = String(preferences.textScale);
  root.style.fontSize = `${preferences.textScale}%`;
  root.style.setProperty(
    "--app-font-family",
    preferences.dyslexicFont ? '"OpenDyslexic", sans-serif' : '"Aeonik", sans-serif',
  );
}

export function initializeAccessibility() {
  applyAccessibility(readAccessibility());
}
