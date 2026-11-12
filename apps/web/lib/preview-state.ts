import { generatePalette, type PaletteRoles } from "./palette";
import { FONTS, type FontStyle } from "./typography";

/**
 * State and history for the interactive landing preview. Pure logic, no React.
 * Limits mirror the design-schema text limits so edits stay valid for DesignForge.
 */

export const LIMITS = { brand: 30, title: 120, description: 300, cta: 40 } as const;

export type Device = "desktop" | "tablet" | "mobile";
export type Align = "left" | "center";
export type FontChoice = "serif" | "sans" | "poster";

export const FONT_CHOICES: Record<FontChoice, { label: string; heading: FontStyle; body: FontStyle }> = {
  serif: { label: "Serif", heading: "serif-editorial", body: "sans-humanist" },
  sans: { label: "Sans", heading: "sans-grotesk", body: "sans-humanist" },
  poster: { label: "Poster", heading: "display-condensed", body: "sans-humanist" },
};

export const PRESETS = [
  { id: "coffee", name: "Kopi", base: "#493426" },
  { id: "violet", name: "Violet", base: "#6D4AFF" },
  { id: "forest", name: "Hutan", base: "#2F5D50" },
  { id: "ember", name: "Bara", base: "#C0733A" },
] as const;
export type PresetId = (typeof PRESETS)[number]["id"];

export interface PreviewState {
  brand: string;
  title: string;
  description: string;
  ctaLabel: string;
  align: Align;
  font: FontChoice;
  preset: PresetId;
  showImage: boolean;
  device: Device;
}

export const INITIAL: PreviewState = {
  brand: "Studio Kopi",
  title: "Coffee, crafted slowly.",
  description: "Single-origin beans, roasted weekly and poured with patience.",
  ctaLabel: "Lihat menu",
  align: "left",
  font: "serif",
  preset: "coffee",
  showImage: true,
  device: "desktop",
};

/** Plain text only: markup characters are stripped, length is capped. */
export function sanitizeText(value: string, max: number): string {
  return value.replace(/[<>]/g, "").slice(0, max);
}

export function applyPatch(state: PreviewState, patch: Partial<PreviewState>): PreviewState {
  const next: PreviewState = { ...state, ...patch };
  next.brand = sanitizeText(next.brand, LIMITS.brand);
  next.title = sanitizeText(next.title, LIMITS.title);
  next.description = sanitizeText(next.description, LIMITS.description);
  next.ctaLabel = sanitizeText(next.ctaLabel, LIMITS.cta);
  return next;
}

export interface History {
  past: PreviewState[];
  present: PreviewState;
  future: PreviewState[];
  lastKey: string | null;
}

export const MAX_HISTORY = 100;

export function initialHistory(state: PreviewState = INITIAL): History {
  return { past: [], present: state, future: [], lastKey: null };
}

export type HistoryAction =
  | { type: "edit"; patch: Partial<PreviewState>; key?: string }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" };

/**
 * Edits with the same `key` (for example, typing in one field) are merged into
 * a single undo step, so undo reverts a phrase rather than one keystroke.
 */
export function historyReducer(h: History, action: HistoryAction): History {
  switch (action.type) {
    case "edit": {
      const nextPresent = applyPatch(h.present, action.patch);
      if (JSON.stringify(nextPresent) === JSON.stringify(h.present)) return h;
      const merge = action.key !== undefined && action.key === h.lastKey;
      return {
        past: merge ? h.past : [...h.past, h.present].slice(-MAX_HISTORY),
        present: nextPresent,
        future: [],
        lastKey: action.key ?? null,
      };
    }
    case "undo": {
      const prev = h.past[h.past.length - 1];
      if (!prev) return h;
      return { past: h.past.slice(0, -1), present: prev, future: [h.present, ...h.future], lastKey: null };
    }
    case "redo": {
      const [next, ...rest] = h.future;
      if (!next) return h;
      return { past: [...h.past, h.present], present: next, future: rest, lastKey: null };
    }
    case "reset":
      return initialHistory(INITIAL);
  }
}

export function deriveTheme(state: PreviewState): { palette: PaletteRoles; headingFamily: string; bodyFamily: string; headingStack: string; bodyStack: string } {
  const preset = PRESETS.find((p) => p.id === state.preset) ?? PRESETS[0];
  const palette = generatePalette(preset.base, "complementary");
  const choice = FONT_CHOICES[state.font];
  const h = FONTS[choice.heading];
  const b = FONTS[choice.body];
  return {
    palette,
    headingFamily: h.family,
    bodyFamily: b.family,
    headingStack: `"${h.family}", ${h.fallback}`,
    bodyStack: `"${b.family}", ${b.fallback}`,
  };
}

export const DEVICE_WIDTH: Record<Device, string> = { desktop: "100%", tablet: "600px", mobile: "360px" };
