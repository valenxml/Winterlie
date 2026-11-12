import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contrastRatio, contrastLevel, ensureContrast, generatePalette, hexToRgb, hslToHex, rgbToHex, rgbToHsl, isHex,
} from "./palette.js";

test("hex round-trips through RGB", () => {
  assert.equal(rgbToHex(hexToRgb("#6D4AFF")), "#6D4AFF");
  assert.equal(rgbToHex(hexToRgb("#0a0b0c")), "#0A0B0C");
  assert.throws(() => hexToRgb("#12345"));
});

test("HSL round-trips within rounding error", () => {
  const original = hexToRgb("#6D4AFF");
  const back = hexToRgb(hslToHex(rgbToHsl(original)));
  for (const k of ["r", "g", "b"] as const) {
    assert.ok(Math.abs(back[k] - original[k]) <= 2, `${k}: ${back[k]} vs ${original[k]}`);
  }
  assert.equal(hslToHex({ h: 0, s: 0, l: 100 }), "#FFFFFF");
  assert.equal(hslToHex({ h: 0, s: 0, l: 0 }), "#000000");
});

test("contrast of black and white is 21", () => {
  assert.equal(contrastRatio("#000000", "#FFFFFF"), 21);
  assert.equal(contrastLevel(21), "AAA");
});

test("known WCAG pair: #767676 on white is just above AA", () => {
  const r = contrastRatio("#767676", "#FFFFFF");
  assert.ok(r >= 4.5 && r < 4.6, `got ${r}`);
  assert.equal(contrastLevel(r), "AA");
});

test("ensureContrast meets the target without changing a passing color", () => {
  assert.equal(ensureContrast("#000000", "#FFFFFF", 4.5), "#000000");
  const fixed = ensureContrast("#FFD400", "#FFFFFF", 4.5);
  assert.ok(contrastRatio(fixed, "#FFFFFF") >= 4.5);
});

test("generated palettes always have readable text, primary, and muted colors", () => {
  const bases = ["#6D4AFF", "#FFD400", "#2BB673", "#E03131", "#0EA5E9", "#F59E0B", "#111111"];
  const schemes = ["complementary", "analogous", "triadic", "monochrome"] as const;
  for (const base of bases) {
    for (const scheme of schemes) {
      const p = generatePalette(base, scheme);
      for (const key of Object.keys(p) as (keyof typeof p)[]) {
        assert.ok(isHex(p[key]), `${base} ${scheme} ${key} = ${p[key]}`);
      }
      assert.ok(contrastRatio(p.text, p.background) >= 7, `text on bg (${base}, ${scheme})`);
      assert.ok(contrastRatio(p.muted, p.background) >= 4.5, `muted on bg (${base}, ${scheme})`);
      assert.ok(contrastRatio(p.primary, "#FFFFFF") >= 4.5, `white on primary (${base}, ${scheme})`);
    }
  }
});

test("complementary accent sits roughly opposite the base hue", () => {
  const base = rgbToHsl(hexToRgb("#6D4AFF"));
  const accent = rgbToHsl(hexToRgb(generatePalette("#6D4AFF", "complementary").accent));
  const diff = Math.abs(((accent.h - base.h) % 360 + 360) % 360);
  assert.ok(Math.abs(diff - 180) <= 6, `hue diff ${diff}`);
});
