/** Canvas/SVG chart text must explicitly follow the site's font and text scale. */
export function applyChartTypography<T extends object>(
  options: T,
  container: HTMLElement,
): T & { textStyle: { fontFamily: string; fontSize: number } } {
  const fontFamily =
    getComputedStyle(container).fontFamily ||
    getComputedStyle(document.body).fontFamily ||
    "Aeonik, sans-serif";
  const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const scale = Number.isFinite(rootSize) ? rootSize / 16 : 1;
  const textKeys = new Set(["textStyle", "axisLabel", "nameTextStyle", "label"]);

  function visit(value: unknown, key = ""): unknown {
    if (key === "data") return value;
    if (Array.isArray(value)) return value.map((item) => visit(item));
    if (!value || typeof value !== "object" || Object.getPrototypeOf(value) !== Object.prototype)
      return value;
    const result: Record<string, unknown> = {};
    for (const [name, item] of Object.entries(value)) {
      result[name] =
        name === "fontSize" && typeof item === "number"
          ? item * scale
          : name === "fontFamily"
            ? fontFamily
            : visit(item, name);
    }
    if (textKeys.has(key)) result.fontFamily = fontFamily;
    return result;
  }
  const result = visit(options) as T & { textStyle: { fontFamily: string; fontSize: number } };
  result.textStyle = Object.assign({ fontSize: 12 * scale }, result.textStyle, { fontFamily });
  return result;
}

export function observeChartAppearance(update: () => void) {
  const observer = new MutationObserver(update);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "style", "data-dyslexic", "data-text-scale"],
  });
  document.fonts?.addEventListener("loadingdone", update);
  return {
    disconnect() {
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", update);
    },
  };
}
