import { describe, expect, it } from "vite-plus/test";
import {
  legendFillStyle,
  legendOutlineStyle,
} from "@/components/evilcharts/ui/echarts-legend-utils";

describe("legend indicator styles", () => {
  it("uses a solid background color for a single slot", () => {
    expect(legendFillStyle("revenue", 1)).toEqual({ backgroundColor: "var(--color-revenue-0)" });
  });

  it("preserves all theme-variable stops in a multi-color background", () => {
    expect(legendFillStyle("revenue", 3)).toEqual({
      background:
        "linear-gradient(to right, var(--color-revenue-0) 0%, var(--color-revenue-1) 50%, var(--color-revenue-2) 100%)",
    });
  });

  it.each([1, 2])(
    "retains the %i-slot paint when punching out an outline's content box",
    (count) => {
      const outline = legendOutlineStyle("revenue", count);
      expect(outline).toMatchObject(
        count === 1
          ? { backgroundColor: "var(--color-revenue-0)" }
          : {
              background:
                "linear-gradient(to right, var(--color-revenue-0) 0%, var(--color-revenue-1) 100%)",
            },
      );
      expect(outline.mask).toContain("content-box");
      expect(outline.maskComposite).toBe("exclude");
      expect(outline.WebkitMask).toContain("content-box");
      expect(outline.WebkitMaskComposite).toBe("xor");
    },
  );
});
