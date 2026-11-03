// @vitest-environment node
import { describe, expect, it } from "vite-plus/test";
import {
  buildBrushDataZoom,
  syncBrushOverlay,
  type BrushOverlayElements,
  type BrushOverlayParams,
} from "@/components/evilcharts/ui/echarts-brush-utils";

type OverlayElement =
  | BrushOverlayElements["frame"]
  | BrushOverlayElements["grips"][number]
  | BrushOverlayElements["labelStart"];

function overlayHarness() {
  const visibleElements = new Set<OverlayElement>();
  const renderer = {
    add(element: OverlayElement) {
      visibleElements.add(element);
    },
    remove(element: OverlayElement) {
      visibleElements.delete(element);
    },
  };
  // The overlay only uses getZr/add/remove. Keep real zrender elements and their
  // mutations; project just that chart boundary instead of simulating a canvas.
  const chart = { getZr: () => renderer } as unknown as Parameters<typeof syncBrushOverlay>[0];
  const store: { brushOverlay: BrushOverlayElements | null } = { brushOverlay: null };
  return { chart, store, visibleElements };
}

function overlayParams(): BrushOverlayParams {
  return {
    range: { start: 25, end: 75 },
    geom: { bottom: 20, height: 40 },
    size: { width: 416, height: 240 },
    tokens: {
      background: "rgba(20, 40, 60, 0.5)",
      border: "rgba(100, 120, 140, 0.2)",
      foreground: "rgb(240, 240, 240)",
      mutedForeground: "rgb(120, 120, 120)",
    },
    labels: { start: "Jan", end: "Sep" },
    showLabels: true,
    hover: { left: false, right: true },
  };
}

describe("brush interaction configuration", () => {
  it.each([
    { start: 0, end: 100 },
    { start: 12.5, end: 67.5 },
    { start: 0, end: 0 },
  ])("preserves range $start–$end when rebuilding the slider", ({ start, end }) => {
    const [slider, inside] = buildBrushDataZoom({
      brushBottom: 24,
      brushHeight: 32,
      brushRange: { start, end },
      fillerColor: "rgba(10, 20, 30, 0.1)",
    });
    expect(slider).toMatchObject({
      type: "slider",
      start,
      end,
      xAxisIndex: [0],
      bottom: 24,
      height: 32,
      left: 8,
      right: 8,
      fillerColor: "rgba(10, 20, 30, 0.1)",
    });
    expect(inside).toMatchObject({ type: "inside", xAxisIndex: [0] });
  });
});

describe("brush overlay", () => {
  it("maps selection percentages to the inset track and dims only the excluded intervals", () => {
    const { chart, store } = overlayHarness();
    syncBrushOverlay(chart, store, overlayParams());
    const overlay = store.brushOverlay!;
    expect(overlay.frame.shape).toMatchObject({ x: 108, y: 180, width: 200, height: 40 });
    expect(overlay.dimLeft.shape).toMatchObject({ x: 8, y: 180, width: 100, height: 40 });
    expect(overlay.dimRight.shape).toMatchObject({ x: 308, y: 180, width: 100, height: 40 });
    expect(overlay.dimLeft.style.fill).toBe("rgba(20, 40, 60, 0.350)");
    expect(overlay.dimRight.style.fill).toBe("rgba(20, 40, 60, 0.350)");
    expect(overlay.frame.style.stroke).toBe("rgba(100, 120, 140, 0.200)");
    expect(overlay.pillLeft.shape).toMatchObject({ x: 105, y: 192, width: 6, height: 16 });
    expect(overlay.pillRight.shape).toMatchObject({ x: 305, y: 192, width: 6, height: 16 });
    expect(overlay.pillLeft.style.fill).toBe("rgb(120, 120, 120)");
    expect(overlay.pillRight.style.fill).toBe("rgb(240, 240, 240)");
    expect(overlay.grips.map((grip) => [grip.shape.cx, grip.shape.cy])).toEqual([
      [108, 196],
      [108, 200],
      [108, 204],
      [308, 196],
      [308, 200],
      [308, 204],
    ]);
    expect(overlay.labelStart.style).toMatchObject({ text: "Jan", x: 114, y: 220, align: "left" });
    expect(overlay.labelEnd.style).toMatchObject({ text: "Sep", x: 302, y: 220, align: "right" });
    expect(overlay.labelStart.invisible).toBe(false);
    expect(overlay.labelEnd.invisible).toBe(false);
  });

  it("reuses the live overlay during range changes and fully removes it when disabled", () => {
    const { chart, store, visibleElements } = overlayHarness();
    const params = overlayParams();
    syncBrushOverlay(chart, store, params);
    const original = store.brushOverlay!;
    const initialElements = [...visibleElements];
    expect(visibleElements.size).toBe(13);

    syncBrushOverlay(chart, store, {
      ...params,
      range: { start: 0, end: 100 },
      hover: { left: true, right: false },
    });
    expect(store.brushOverlay).toBe(original);
    expect([...visibleElements]).toEqual(initialElements);
    expect(original.frame.shape).toMatchObject({ x: 8, width: 400 });
    expect(original.dimLeft.shape.width).toBe(0);
    expect(original.dimRight.shape.width).toBe(0);
    expect(original.pillLeft.style.fill).toBe("rgb(240, 240, 240)");
    expect(original.pillRight.style.fill).toBe("rgb(120, 120, 120)");

    syncBrushOverlay(chart, store, null);
    expect(store.brushOverlay).toBeNull();
    expect(visibleElements.size).toBe(0);
    syncBrushOverlay(chart, store, null);
    expect(visibleElements.size).toBe(0);

    syncBrushOverlay(chart, store, params);
    expect(store.brushOverlay).not.toBe(original);
    expect(visibleElements.size).toBe(13);
  });

  it("hides absent labels and responds to labels being disabled and enabled", () => {
    const { chart, store } = overlayHarness();
    const params = overlayParams();
    syncBrushOverlay(chart, store, { ...params, labels: null });
    const overlay = store.brushOverlay!;
    expect(overlay.labelStart.invisible).toBe(true);
    expect(overlay.labelEnd.invisible).toBe(true);

    syncBrushOverlay(chart, store, { ...params, showLabels: false });
    expect(overlay.labelStart.invisible).toBe(true);
    expect(overlay.labelEnd.invisible).toBe(true);

    syncBrushOverlay(chart, store, { ...params, labels: { start: "", end: "Sep" } });
    expect(overlay.labelStart.invisible).toBe(true);
    expect(overlay.labelEnd.invisible).toBe(false);
  });

  it("keeps an undersized track from producing negative widths", () => {
    const { chart, store } = overlayHarness();
    syncBrushOverlay(chart, store, { ...overlayParams(), size: { width: 10, height: 100 } });
    const overlay = store.brushOverlay!;
    expect(overlay.frame.shape).toMatchObject({ x: 8, y: 40, width: 0 });
    expect(overlay.dimLeft.shape.width).toBe(0);
    expect(overlay.dimRight.shape.width).toBe(0);
  });

  it("ignores an unavailable renderer without allocating an overlay", () => {
    const chart = { getZr: () => null } as unknown as Parameters<typeof syncBrushOverlay>[0];
    const store = { brushOverlay: null };
    syncBrushOverlay(chart, store, overlayParams());
    expect(store.brushOverlay).toBeNull();
  });
});
