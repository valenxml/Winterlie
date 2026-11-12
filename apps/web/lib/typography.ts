/**
 * Typography tokens. Style names match FONT_STYLES and the scale names match
 * designTokensSchema in packages/design-schema, so a pairing chosen here can be
 * stored directly in a DesignForge spec.
 */

export const FONT_STYLES = [
  "serif-editorial", "serif-classic", "sans-grotesk", "sans-humanist",
  "sans-geometric", "display-condensed", "mono-technical",
] as const;
export type FontStyle = (typeof FONT_STYLES)[number];

export const SCALES = ["compact", "balanced", "dramatic"] as const;
export type TypeScale = (typeof SCALES)[number];

export interface FontDef {
  style: FontStyle;
  family: string;
  fallback: string;
  note: string;
}

export const FONTS: Record<FontStyle, FontDef> = {
  "serif-editorial": { style: "serif-editorial", family: "Fraunces", fallback: "Georgia, serif", note: "Hangat, editorial" },
  "serif-classic": { style: "serif-classic", family: "Playfair Display", fallback: "Georgia, serif", note: "Klasik, elegan" },
  "sans-grotesk": { style: "sans-grotesk", family: "Space Grotesk", fallback: "system-ui, sans-serif", note: "Tegas, modern" },
  "sans-humanist": { style: "sans-humanist", family: "Source Sans 3", fallback: "system-ui, sans-serif", note: "Mudah dibaca" },
  "sans-geometric": { style: "sans-geometric", family: "Poppins", fallback: "system-ui, sans-serif", note: "Bersih, geometris" },
  "display-condensed": { style: "display-condensed", family: "Oswald", fallback: "Impact, sans-serif", note: "Padat, poster" },
  "mono-technical": { style: "mono-technical", family: "JetBrains Mono", fallback: "ui-monospace, Menlo, monospace", note: "Teknis, kode" },
};

export interface Pairing {
  id: string;
  name: string;
  heading: FontStyle;
  body: FontStyle;
  summary: string;
}

export const PAIRINGS: Pairing[] = [
  { id: "editorial-warm", name: "Editorial hangat", heading: "serif-editorial", body: "sans-humanist", summary: "Cocok untuk kopi, kuliner, dan brand yang bercerita." },
  { id: "classic-elegant", name: "Klasik elegan", heading: "serif-classic", body: "sans-humanist", summary: "Cocok untuk hotel, butik, dan jasa premium." },
  { id: "modern-bold", name: "Modern tegas", heading: "sans-grotesk", body: "sans-humanist", summary: "Cocok untuk startup dan produk digital." },
  { id: "geometric-clean", name: "Geometris bersih", heading: "sans-geometric", body: "sans-humanist", summary: "Cocok untuk layanan umum dan UMKM yang ramah." },
  { id: "technical-dash", name: "Dashboard teknis", heading: "sans-grotesk", body: "mono-technical", summary: "Cocok untuk dashboard, dokumentasi, dan tools developer." },
  { id: "poster-dense", name: "Poster padat", heading: "display-condensed", body: "sans-humanist", summary: "Cocok untuk event, musik, dan promosi berani." },
];

/** Font size and line height in px for each scale. Heading sizes step down from h1. */
export const SCALE_SIZES: Record<TypeScale, { h1: number; h2: number; h3: number; body: number; lineHeight: number }> = {
  compact: { h1: 32, h2: 24, h3: 18, body: 15, lineHeight: 1.5 },
  balanced: { h1: 44, h2: 30, h3: 22, body: 16, lineHeight: 1.6 },
  dramatic: { h1: 64, h2: 40, h3: 26, body: 17, lineHeight: 1.65 },
};

export function googleFontsUrl(): string {
  const families = Object.values(FONTS).map((f) => `family=${f.family.replace(/ /g, "+")}:wght@400..700`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export function stackFor(style: FontStyle): string {
  const f = FONTS[style];
  return `"${f.family}", ${f.fallback}`;
}

export function toCssVariables(heading: FontStyle, body: FontStyle, scale: TypeScale): string {
  const s = SCALE_SIZES[scale];
  return [
    ":root {",
    `  --font-heading: ${stackFor(heading)};`,
    `  --font-body: ${stackFor(body)};`,
    `  --text-h1: ${s.h1}px;`,
    `  --text-h2: ${s.h2}px;`,
    `  --text-h3: ${s.h3}px;`,
    `  --text-body: ${s.body}px;`,
    `  --leading: ${s.lineHeight};`,
    "}",
  ].join("\n");
}

/** Shape matches the typography part of designTokensSchema. */
export function toTokenJson(heading: FontStyle, body: FontStyle, scale: TypeScale): string {
  return JSON.stringify({ typography: { heading, body, scale } }, null, 2);
}
