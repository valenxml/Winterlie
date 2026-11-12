/**
 * Pure color utilities for palette generation and WCAG contrast checks.
 * No DOM or network access, so it runs on the server, in the browser, and in tests.
 */

export type Rgb = { r: number; g: number; b: number };
export type Hsl = { h: number; s: number; l: number }; // h: 0-360, s/l: 0-100
export type Scheme = "complementary" | "analogous" | "triadic" | "monochrome";

export interface PaletteRoles {
  primary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
}

const HEX = /^#?([0-9a-f]{6})$/i;

export function isHex(value: string): boolean {
  return HEX.test(value.trim());
}

export function hexToRgb(hex: string): Rgb {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const n = parseInt(m[1]!, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  // Keep full precision: rounding here shifts brand colors when converted back.
  return { h: h % 360, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = Math.min(100, Math.max(0, s)) / 100;
  const ln = Math.min(100, Math.max(0, l)) / 100;
  if (sn === 0) {
    const v = ln * 255;
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const f = (t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  return { r: f(hn + 1 / 3) * 255, g: f(hn) * 255, b: f(hn - 1 / 3) * 255 };
}

export function hslToHex(hsl: Hsl): string {
  return rgbToHex(hslToRgb(hsl));
}

/** WCAG 2.x relative luminance. */
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG contrast ratio between two hex colors, from 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

export type ContrastLevel = "AAA" | "AA" | "AA Large" | "Fail";

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

/**
 * Darkens (or lightens) a color until it reaches the target contrast against `against`.
 * Keeps hue and saturation so the result still belongs to the same palette.
 */
export function ensureContrast(hex: string, against: string, target = 4.5): string {
  if (contrastRatio(hex, against) >= target) return hex;
  const hsl = rgbToHsl(hexToRgb(hex));
  const bgIsDark = luminance(against) < 0.5;
  let l = hsl.l;
  for (let i = 0; i < 100; i++) {
    l = bgIsDark ? Math.min(100, l + 1) : Math.max(0, l - 1);
    const candidate = hslToHex({ ...hsl, l });
    if (contrastRatio(candidate, against) >= target) return candidate;
  }
  return bgIsDark ? "#FFFFFF" : "#000000";
}

const HUE_SHIFT: Record<Exclude<Scheme, "monochrome">, number> = {
  complementary: 180,
  analogous: 30,
  triadic: 120,
};

/**
 * Builds a seven-role palette from one base color. Text, muted, and primary
 * are adjusted so they pass WCAG AA against the surfaces they sit on.
 */
export function generatePalette(baseHex: string, scheme: Scheme = "complementary"): PaletteRoles {
  const base = rgbToHsl(hexToRgb(baseHex));
  const shift = scheme === "monochrome" ? 0 : HUE_SHIFT[scheme];
  const accentHue = (base.h + shift) % 360;

  const background = hslToHex({ h: base.h, s: Math.min(base.s, 40), l: 97 });
  const surface = "#FFFFFF";
  const text = ensureContrast(hslToHex({ h: base.h, s: Math.min(base.s, 30), l: 12 }), background, 7);
  const muted = ensureContrast(hslToHex({ h: base.h, s: Math.min(base.s, 20), l: 45 }), background, 4.5);
  const border = hslToHex({ h: base.h, s: Math.min(base.s, 25), l: 88 });
  const primary = ensureContrast(baseHex.toUpperCase(), "#FFFFFF", 4.5);
  const accent =
    scheme === "monochrome"
      ? hslToHex({ h: base.h, s: Math.max(base.s, 60), l: Math.min(70, base.l + 20) })
      : hslToHex({ h: accentHue, s: Math.max(base.s, 55), l: 60 });

  return { primary, accent, background, surface, text, muted, border };
}

export function toCssVariables(p: PaletteRoles): string {
  return [
    ":root {",
    `  --primary: ${p.primary};`,
    `  --accent: ${p.accent};`,
    `  --background: ${p.background};`,
    `  --surface: ${p.surface};`,
    `  --text: ${p.text};`,
    `  --muted: ${p.muted};`,
    `  --border: ${p.border};`,
    "}",
  ].join("\n");
}
