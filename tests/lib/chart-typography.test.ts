import { afterEach, expect, it } from "vite-plus/test";
import { applyChartTypography } from "@/lib/chart-typography";

afterEach(() => {
  document.documentElement.style.removeProperty("font-size");
  document.body.replaceChildren();
});

it("updates canvas typography without changing source options, data or geometry", () => {
  document.documentElement.style.fontSize = "32px";
  const container = document.createElement("div");
  container.style.fontFamily = "OpenDyslexic, sans-serif";
  document.body.append(container);
  const data = [{ value: 8 }];
  const option = {
    xAxis: { axisLabel: { fontSize: 10 }, nameTextStyle: { fontSize: 12 } },
    series: [{ label: { fontSize: 14 }, data }],
    grid: { left: 20 },
  };
  const result = applyChartTypography(option, container);
  expect(result).toMatchObject({
    textStyle: { fontFamily: "OpenDyslexic, sans-serif", fontSize: 24 },
    xAxis: { axisLabel: { fontSize: 20 }, nameTextStyle: { fontSize: 24 } },
    series: [{ label: { fontSize: 28 } }],
    grid: { left: 20 },
  });
  expect(result.series[0].data).toBe(data);
  expect(option.xAxis.axisLabel.fontSize).toBe(10);
});
