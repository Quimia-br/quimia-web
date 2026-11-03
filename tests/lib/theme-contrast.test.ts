import { readFileSync } from "node:fs";
import { describe, expect, it } from "vite-plus/test";

const stylesheet = readFileSync("src/index.css", "utf8");
type Color = { rgb: number[]; alpha: number };

function declarations(selector: string): Map<string, string> {
  const start = stylesheet.indexOf(`${selector} {`);
  const block = stylesheet.slice(start, stylesheet.indexOf("}", start));
  return new Map(
    Array.from(block.matchAll(/(--[\w-]+):\s*([^;]+);/g), ([, key, value]) => [key, value]),
  );
}
function color(tokens: Map<string, string>, name: string): Color {
  const value = tokens.get(name);
  if (!value) throw new Error(`Missing color ${name}`);
  const reference = value.match(/^var\((--[\w-]+)\)$/);
  if (reference) return color(tokens, reference[1]);
  const match = value.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+)(%)?)?\)$/);
  if (!match) throw new Error(`Unsupported color ${name}: ${value}`);
  const [, lightness, chroma, hue, alpha, percent] = match;
  const angle = (Number(hue) * Math.PI) / 180;
  const a = Number(chroma) * Math.cos(angle);
  const b = Number(chroma) * Math.sin(angle);
  // OKLab -> linear sRGB, then encode channels before alpha compositing.
  const l = (Number(lightness) + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (Number(lightness) - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (Number(lightness) - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return {
    rgb: linear.map((channel) => {
      const clipped = Math.min(1, Math.max(0, channel));
      return clipped <= 0.0031308 ? 12.92 * clipped : 1.055 * clipped ** (1 / 2.4) - 0.055;
    }),
    alpha: alpha === undefined ? 1 : Number(alpha) / (percent ? 100 : 1),
  };
}
function luminance(channels: number[]): number {
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function ratio(tokens: Map<string, string>, ink: string, surface: string): number {
  const foreground = color(tokens, ink);
  const background = color(tokens, surface);
  const painted = foreground.rgb.map(
    (channel, index) => channel * foreground.alpha + background.rgb[index] * (1 - foreground.alpha),
  );
  const a = luminance(painted),
    b = luminance(background.rgb);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// WCAG 2.2 SC 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
const textPairs = [
  ["--text-primary", "--surface-background"],
  ["--text-secondary", "--surface-background"],
  ["--text-secondary", "--surface-base"],
  ["--foreground-subtle", "--surface-background"],
  ["--foreground-subtle", "--surface-base"],
  ["--muted-foreground", "--muted"],
  ["--destructive", "--background"],
  ["--destructive", "--input"],
  ["--foreground-error", "--feedback-error"],
  ["--foreground-on-color", "--feedback-error"],
  ["--primary-foreground", "--primary-primary"],
  ["--primary-foreground", "--primary-hover"],
  ["--primary-foreground", "--primary-pressed"],
  ["--secondary-foreground", "--secondary-primary"],
  ["--secondary-foreground", "--secondary-hover"],
  ["--secondary-foreground", "--secondary-secondary"],
  ["--destructive-foreground", "--destructive"],
];

describe.each([":root", ".dark"])("theme contrast %s", (selector) => {
  const tokens = new Map([...declarations(":root"), ...declarations(selector)]);
  it.each(textPairs)("keeps normal text %s readable on %s", (ink, surface) => {
    expect(ratio(tokens, ink, surface), `${ink} on ${surface}`).toBeGreaterThanOrEqual(4.5);
  });
  it.each(["--feedback-success", "--feedback-error"])(
    "keeps the large feedback symbol %s distinguishable",
    (ink) => {
      expect(ratio(tokens, ink, "--secondary-primary")).toBeGreaterThanOrEqual(3);
    },
  );
  it.each(["--background", "--surface-base"])("keeps the focus ring visible on %s", (surface) => {
    expect(ratio(tokens, "--border-focus", surface)).toBeGreaterThanOrEqual(3);
  });
});
