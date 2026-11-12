import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FONT_STYLES, FONTS, PAIRINGS, SCALES, SCALE_SIZES, googleFontsUrl, toCssVariables, toTokenJson,
} from "./typography.js";

// Must stay identical to FONT_STYLES in packages/design-schema/src/tokens.ts
const SCHEMA_FONT_STYLES = [
  "serif-editorial", "serif-classic", "sans-grotesk", "sans-humanist",
  "sans-geometric", "display-condensed", "mono-technical",
];

test("font styles match the design schema allowlist", () => {
  assert.deepEqual([...FONT_STYLES], SCHEMA_FONT_STYLES);
  for (const s of FONT_STYLES) assert.ok(FONTS[s], s);
});

test("every pairing references valid styles", () => {
  for (const p of PAIRINGS) {
    assert.ok((FONT_STYLES as readonly string[]).includes(p.heading), p.id);
    assert.ok((FONT_STYLES as readonly string[]).includes(p.body), p.id);
  }
});

test("pairing ids are unique", () => {
  const ids = PAIRINGS.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("scales step down from h1 to body", () => {
  for (const scale of SCALES) {
    const s = SCALE_SIZES[scale];
    assert.ok(s.h1 > s.h2 && s.h2 > s.h3 && s.h3 > s.body, scale);
  }
});

test("google fonts URL includes every family once", () => {
  const url = googleFontsUrl();
  for (const f of Object.values(FONTS)) {
    assert.ok(url.includes(f.family.replace(/ /g, "+")), f.family);
  }
  assert.ok(url.startsWith("https://fonts.googleapis.com/css2?"));
});

test("css variables use the chosen families and scale", () => {
  const css = toCssVariables("serif-editorial", "sans-humanist", "dramatic");
  assert.ok(css.includes(`--font-heading: "Fraunces", Georgia, serif;`));
  assert.ok(css.includes("--text-h1: 64px;"));
});

test("token JSON matches the schema shape", () => {
  const parsed = JSON.parse(toTokenJson("sans-grotesk", "mono-technical", "compact"));
  assert.deepEqual(parsed, { typography: { heading: "sans-grotesk", body: "mono-technical", scale: "compact" } });
});
