import type { FC } from "react";

export interface BrushProps {
  height?: number; // brush preview strip height in px (default 56)
  formatLabel?: (value: string, index: number) => string; // formats the range-handle labels
  onChange?: (range: { startIndex: number; endIndex: number }) => void; // fires as the range moves
}

/** Declares the zoom brush below the chart. Presence renders it; renders nothing itself. */
export const Brush: FC<BrushProps> = () => null;
