import {
  isStorageRecord,
  readStoredValue,
  writeStoredValue,
  type StorageSchema,
} from "@/utils/storage";

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

function isTextScale(value: unknown): value is TextScale {
  return TEXT_SCALES.some((scale) => scale === value);
}

function parseAccessibility(value: unknown): AccessibilityPreferences | undefined {
  if (
    !isStorageRecord(value) ||
    value.version !== 1 ||
    typeof value.dyslexicFont !== "boolean" ||
    !isTextScale(value.textScale) ||
    typeof value.vlibrasEnabled !== "boolean"
  )
    return undefined;
  return {
    version: 1,
    dyslexicFont: value.dyslexicFont,
    textScale: value.textScale,
    vlibrasEnabled: value.vlibrasEnabled,
  };
}

const accessibilitySchema: StorageSchema<AccessibilityPreferences> = {
  version: 1,
  parse: parseAccessibility,
  migrate(value) {
    if (!isStorageRecord(value)) return undefined;
    return parseAccessibility({
      ...value,
      vlibrasEnabled: Object.hasOwn(value, "vlibrasEnabled") ? value.vlibrasEnabled : false,
    });
  },
};

export function readAccessibility(): AccessibilityPreferences {
  return readStoredValue(ACCESSIBILITY_KEY, accessibilitySchema, { ...DEFAULT_ACCESSIBILITY });
}

export function writeAccessibility(preferences: AccessibilityPreferences): void {
  writeStoredValue(ACCESSIBILITY_KEY, preferences, accessibilitySchema);
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
