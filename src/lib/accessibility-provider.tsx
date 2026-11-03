import { useLayoutEffect, useState, type ReactNode } from "react";
import { AccessibilityContext } from "@/hooks/use-accessibility";
import {
  DEFAULT_ACCESSIBILITY,
  TEXT_SCALES,
  applyAccessibility,
  readAccessibility,
  writeAccessibility,
  type AccessibilityPreferences,
  type TextScale,
} from "./accessibility";

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readAccessibility);
  const [gazeEnabled, setGazeEnabled] = useState(false);

  useLayoutEffect(() => {
    applyAccessibility(preferences);
    writeAccessibility(preferences);
  }, [preferences]);

  function update(patch: Partial<AccessibilityPreferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
  }
  function setTextScale(textScale: TextScale) {
    if (TEXT_SCALES.includes(textScale)) update({ textScale });
  }

  return (
    <AccessibilityContext.Provider
      value={{
        ...preferences,
        setTextScale,
        setDyslexicFont: (dyslexicFont) => update({ dyslexicFont }),
        setVlibrasEnabled: (vlibrasEnabled) => update({ vlibrasEnabled }),
        gazeEnabled,
        setGazeEnabled,
        reset: () => {
          setPreferences({ ...DEFAULT_ACCESSIBILITY });
          setGazeEnabled(false);
        },
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}
