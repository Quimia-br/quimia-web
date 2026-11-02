import { createContext, useContext } from "react";
import type { AccessibilityPreferences, TextScale } from "@/lib/accessibility";

export interface AccessibilityState extends AccessibilityPreferences {
  setTextScale: (scale: TextScale) => void;
  setDyslexicFont: (enabled: boolean) => void;
  setVlibrasEnabled: (enabled: boolean) => void;
  gazeEnabled: boolean;
  setGazeEnabled: (enabled: boolean) => void;
  reset: () => void;
}
export const AccessibilityContext = createContext<AccessibilityState | null>(null);

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error("useAccessibility requires AccessibilityProvider");
  return context;
}
