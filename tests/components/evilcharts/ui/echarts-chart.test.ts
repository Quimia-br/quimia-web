import { afterEach, describe, expect, it, vi } from "vite-plus/test";
import {
  buildChartCss,
  distributeColors,
  flattenColor,
  getColorsCount,
  indicatorBackground,
  normalizeColor,
  resolveColors,
  seriesPaint,
  withAlpha,
  type ChartConfig,
} from "@/components/evilcharts/ui/echarts-chart";

afterEach(() => {
  document.body.replaceChildren();
  document.head.querySelectorAll("style[data-test-chart]").forEach((style) => style.remove());
  vi.restoreAllMocks();
});

describe("chart color slots", () => {
  it.each([
    { item: {}, count: 1 },
    { item: { colors: { light: [] } }, count: 1 },
    { item: { colors: { dark: ["navy", "cyan"] } }, count: 2 },
    { item: { colors: { light: ["red", "blue"], dark: ["black", "gray", "white"] } }, count: 3 },
  ] satisfies { item: ChartConfig[string]; count: number }[])(
    "reserves $count slots for $item",
    ({ item, count }) => expect(getColorsCount(item)).toBe(count),
  );

  it.each([
    { colors: ["red", "green", "blue"], count: 5, want: ["red", "green", "green", "blue", "blue"] },
    { colors: ["red", "blue"], count: 4, want: ["red", "red", "blue", "blue"] },
    { colors: ["red"], count: 3, want: ["red", "red", "red"] },
    { colors: ["red", "green", "blue"], count: 2, want: ["red", "green"] },
    { colors: [], count: 3, want: [] },
  ])("distributes $colors into $count ordered slots", ({ colors, count, want }) => {
    expect(distributeColors(colors, count)).toEqual(want);
  });

  it("applies the same number of slots across themes without leaking colors to another chart", () => {
    const style = document.createElement("style");
    style.dataset.testChart = "true";
    style.textContent = buildChartCss("revenue", {
      revenue: { colors: { light: ["red", "blue"], dark: ["black", "gray", "white"] } },
      darkOnly: { colors: { dark: ["purple"] } },
      labelOnly: { label: "Total" },
    });
    document.head.appendChild(style);
    const wrapper = document.createElement("div");
    const chart = document.createElement("div");
    chart.dataset.chart = "revenue";
    const otherChart = document.createElement("div");
    otherChart.dataset.chart = "expenses";
    wrapper.append(chart, otherChart);
    document.body.append(wrapper);

    let colors = getComputedStyle(chart);
    expect(colors.getPropertyValue("--color-revenue-0").trim()).toBe("red");
    expect(colors.getPropertyValue("--color-revenue-1").trim()).toBe("blue");
    expect(colors.getPropertyValue("--color-revenue-2").trim()).toBe("blue");
    expect(colors.getPropertyValue("--color-darkOnly-0")).toBe("");
    expect(colors.getPropertyValue("--color-labelOnly-0")).toBe("");
    expect(getComputedStyle(otherChart).getPropertyValue("--color-revenue-0")).toBe("");

    wrapper.className = "dark";
    colors = getComputedStyle(chart);
    expect(colors.getPropertyValue("--color-revenue-0").trim()).toBe("black");
    expect(colors.getPropertyValue("--color-revenue-1").trim()).toBe("gray");
    expect(colors.getPropertyValue("--color-revenue-2").trim()).toBe("white");
    expect(colors.getPropertyValue("--color-darkOnly-0").trim()).toBe("purple");
  });

  it("does not emit chart CSS when the config only supplies labels", () => {
    expect(buildChartCss("revenue", { total: { label: "Total" } })).toBe("");
  });
});

describe("color composition", () => {
  it.each([
    { color: "rgba(240, 120, 20, 0.25)", alpha: 0.4, want: "rgba(240, 120, 20, 0.100)" },
    { color: "rgb(240, 120, 20)", alpha: 0.5, want: "rgba(240, 120, 20, 0.500)" },
    { color: "rgba(240, 120, 20, 0)", alpha: 0.5, want: "rgba(240, 120, 20, 0.000)" },
    { color: "rgba(240, 120, 20, 1)", alpha: 0, want: "rgba(240, 120, 20, 0.000)" },
    { color: "var(--border)", alpha: 0.5, want: "var(--border)" },
  ])("multiplies existing alpha for $color by $alpha", ({ color, alpha, want }) => {
    expect(withAlpha(color, alpha)).toBe(want);
  });

  it.each([
    { color: "rgba(20, 40, 60, 0.5)", base: "rgb(220, 140, 20)", want: "rgb(120, 90, 40)" },
    { color: "rgba(1, 2, 3, 0)", base: "rgb(100, 150, 200)", want: "rgb(100, 150, 200)" },
    { color: "rgb(1, 2, 3)", base: "rgb(100, 150, 200)", want: "rgb(1, 2, 3)" },
    { color: "rgba(1, 3, 5, 0.5)", base: "rgb(0, 0, 0)", want: "rgb(1, 2, 3)" },
  ])("flattens $color over $base to an opaque color", ({ color, base, want }) => {
    expect(flattenColor(color, base)).toBe(want);
  });

  it("preserves a trimmed CSS color when the browser cannot provide a canvas context", () => {
    // Only the optional pixel-reading boundary is unavailable; no simulated color parser.
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(normalizeColor("  oklch(0.7 0.1 40)  ")).toBe("oklch(0.7 0.1 40)");
    expect(normalizeColor("  ")).toBe("");
  });

  it("resolves requested slots, fills missing slots, and removes its temporary token probe", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const style = document.createElement("style");
    style.dataset.testChart = "true";
    style.textContent = `
      .text-muted-foreground { color: rgb(10, 20, 30); }
      .text-border { color: rgba(40, 50, 60, 0.2); }
      .text-foreground { color: rgb(70, 80, 90); }
      .text-background { color: rgb(100, 110, 120); }
    `;
    document.head.appendChild(style);
    const container = document.createElement("div");
    container.style.setProperty("--color-revenue-0", "  rgb(1, 2, 3)  ");
    const child = document.createElement("span");
    child.textContent = "Existing chart content";
    container.append(child);
    document.body.append(container);

    const colors = resolveColors(
      container,
      {
        revenue: { colors: { light: ["red"], dark: ["blue", "green"] } },
        unused: { colors: { light: ["purple"] } },
      },
      ["revenue", "unknown"],
    );

    expect(colors).toEqual({
      series: {
        revenue: ["rgb(1, 2, 3)", "rgba(120, 120, 120, 1)"],
        unknown: ["rgba(120, 120, 120, 1)"],
      },
      tokens: {
        mutedForeground: "rgb(10, 20, 30)",
        border: "rgba(40, 50, 60, 0.2)",
        foreground: "rgb(70, 80, 90)",
        background: "rgb(100, 110, 120)",
      },
    });
    expect([...container.children]).toEqual([child]);
  });
});

describe("series paints", () => {
  it("creates a left-to-right gradient with evenly spaced authored colors", () => {
    expect(seriesPaint(["red", "green", "blue"])).toMatchObject({
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: "red" },
        { offset: 0.5, color: "green" },
        { offset: 1, color: "blue" },
      ],
    });
  });

  it("uses a solid paint for one color and a visible fallback for missing colors", () => {
    expect(seriesPaint(["red"])).toBe("red");
    expect(seriesPaint([])).toBe("rgba(120, 120, 120, 1)");
  });

  it("uses matching CSS-variable stops for multi-color tooltip and legend indicators", () => {
    expect(indicatorBackground("revenue", 3)).toBe(
      "linear-gradient(to right, var(--color-revenue-0) 0%, var(--color-revenue-1) 50%, var(--color-revenue-2) 100%)",
    );
    expect(indicatorBackground("revenue", 1)).toBe("var(--color-revenue-0)");
  });
});
