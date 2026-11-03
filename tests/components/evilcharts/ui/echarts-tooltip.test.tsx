import { describe, expect, it } from "vite-plus/test";
import { tooltipRow, tooltipShell, tooltipIndicatorHtml } from "@/components/evilcharts/ui/echarts-tooltip";

describe("external report text in chart tooltips", () => {
  it("renders markup as text in headers, labels and values", () => {
    const hostile = '<img src=x onerror="alert(1)">';
    const body = tooltipRow({ indicatorHtml: tooltipIndicatorHtml("consultas", 1), labelText: hostile, valueText: hostile, dimmed: "" });
    const html = tooltipShell({ label: hostile, body, roundness: "sm", variant: "default" });
    const container = document.createElement("div");
    container.innerHTML = html;
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(hostile);
  });
});
