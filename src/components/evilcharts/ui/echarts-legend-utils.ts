import { indicatorBackground } from "./echarts-chart";
import type { CSSProperties } from "react";

export function legendFillStyle(key: string, colorsCount: number): CSSProperties {
  if (colorsCount <= 1) return { backgroundColor: `var(--color-${key}-0)` };
  return { background: indicatorBackground(key, colorsCount) };
}

// Punches out the centre with a mask-composite so only the "border" shows —
// works with gradients and border-radius, unlike plain border-color.
export function legendOutlineStyle(key: string, colorsCount: number): CSSProperties {
  const mask: CSSProperties = {
    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    WebkitMaskComposite: "xor",
    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
    maskComposite: "exclude",
  };
  return { ...legendFillStyle(key, colorsCount), ...mask };
}
