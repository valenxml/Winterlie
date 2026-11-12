import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLandingDirections, clean } from "./templates.js";
import { designSpecSchema } from "./design.js";

const input = { brand: "Kopi Kenangan", description: "Kedai kopi untuk anak muda. Suasana hangat dan tenang." };

test("produces three valid directions", () => {
  const dirs = buildLandingDirections(input);
  assert.equal(dirs.length, 3);
  for (const d of dirs) assert.equal(designSpecSchema.safeParse(d).success, true, d.direction);
});

test("directions differ in archetype and section order", () => {
  const dirs = buildLandingDirections(input);
  assert.equal(new Set(dirs.map((d) => d.direction)).size, 3);
  const orders = dirs.map((d) => d.sections.map((s) => s.type).join(","));
  assert.equal(new Set(orders).size, 3, "section orders must differ");
  const heads = dirs.map((d) => d.tokens.typography.heading);
  assert.equal(new Set(heads).size, 3, "heading fonts must differ");
});

test("markup in the brief is removed before validation", () => {
  const dirs = buildLandingDirections({ brand: "<b>Toko</b>", description: "<script>alert(1)</script> Halo dunia kami." });
  for (const d of dirs) {
    assert.equal(designSpecSchema.safeParse(d).success, true);
    assert.ok(!JSON.stringify(d).includes("<script"));
  }
});

test("long text is truncated to schema limits", () => {
  assert.ok(clean("a".repeat(500), 40).length <= 40);
  const dirs = buildLandingDirections({ brand: "x".repeat(200), description: "y".repeat(2000) });
  for (const d of dirs) assert.equal(designSpecSchema.safeParse(d).success, true);
});

test("empty brand falls back to a neutral name", () => {
  const dirs = buildLandingDirections({ brand: "   ", description: "Deskripsi yang cukup panjang untuk diuji." });
  assert.equal(dirs.length, 3);
  for (const d of dirs) assert.equal(designSpecSchema.safeParse(d).success, true);
});

test("accent word is always a substring of the title", () => {
  for (const d of buildLandingDirections({ brand: "Kopi", description: "Kedai kopi untuk anak muda yang suka suasana tenang." })) {
    for (const sec of d.sections) {
      if (sec.type.startsWith("hero-")) {
        const c = sec.content as { title: string; accent?: string };
        if (c.accent) assert.ok(c.title.includes(c.accent));
      }
    }
  }
});

test("a mismatched accent word is rejected by the spec schema", () => {
  const spec = buildLandingDirections({ brand: "Kopi", description: "Kedai kopi untuk anak muda yang suka suasana tenang." })[0]!;
  const bad = JSON.parse(JSON.stringify(spec));
  const hero = bad.sections.find((s: { type: string }) => s.type.startsWith("hero-"));
  hero.content.accent = "tidakada";
  assert.equal(designSpecSchema.safeParse(bad).success, false);
});
