import { test } from "node:test";
import assert from "node:assert/strict";
import { applySectionCopy, buildSectionPrompt, isRegeneratable, sectionCopySchema } from "./section-regen.js";
import { applyDesignOp } from "./apply-op.js";
import { designSpecSchema } from "./design.js";
import { buildLandingDirections } from "./templates.js";
import { extractJsonObject } from "./copy.js";

const spec = () => buildLandingDirections({ brand: "Kopi Smoke", description: "Kedai kopi untuk anak muda di Bandung." })[0]!;
/** Finds a section of this type in any direction, since each direction uses different sections. */
const byType = (type: string) => {
  for (const d of buildLandingDirections({ brand: "Kopi Smoke", description: "Kedai kopi untuk anak muda di Bandung." })) {
    const found = d.sections.find((s) => s.type === type);
    if (found) return found;
  }
  throw new Error(`no ${type} in any direction`);
};

test("only the listed section types are regeneratable", () => {
  assert.equal(isRegeneratable("hero-editorial"), true);
  assert.equal(isRegeneratable("faq"), true);
  assert.equal(isRegeneratable("navbar"), false);
  assert.equal(isRegeneratable("footer"), false);
  assert.throws(() => sectionCopySchema("navbar"));
});

test("hero regeneration changes text, keeps layout and settings", () => {
  const hero = byType("hero-editorial");
  const copy = { badge: "Baru", title: "Kopi pelan untuk sore hari", accent: "sore", description: "Biji pilihan disangrai setiap pagi.", ctaLabel: "Pesan" };
  const out = applySectionCopy(hero, copy) as any;
  assert.equal(out.content.title, copy.title);
  assert.deepEqual(out.settings, (hero as any).settings);
  assert.equal(out.id, hero.id);
});

test("accent that is not in the new title falls back to the last title word", () => {
  const out = applySectionCopy(byType("hero-split"), { badge: "Baru", title: "Kopi pelan", accent: "tidakada", description: "Deskripsi yang cukup panjang.", ctaLabel: "Pesan" }) as any;
  assert.equal(out.content.accent, "pelan");
});

test("feature regeneration keeps icons and item count", () => {
  const grid = byType("feature-grid") as any;
  const copy = { heading: "Kenapa kami", items: [{ title: "Biji lokal", description: "Dipilih langsung dari petani." }, { title: "Sangrai baru", description: "Disangrai setiap minggu." }] };
  const out = applySectionCopy(grid, copy) as any;
  assert.equal(out.content.items.length, grid.content.items.length);
  assert.equal(out.content.items[0].icon, grid.content.items[0].icon);
  assert.equal(out.content.items[0].title, "Biji lokal");
});

test("the regenerated section validates as a whole spec, and other sections are untouched", () => {
  const s = spec();
  const hero = byType("hero-editorial");
  const newHero = applySectionCopy(hero, { badge: "Baru", title: "Kopi pelan untuk sore", accent: "sore", description: "Biji pilihan disangrai setiap pagi.", ctaLabel: "Pesan" });
  const next = applyDesignOp(s, { op: "replace", sectionId: hero.id, section: newHero });
  assert.equal(designSpecSchema.safeParse(next).success, true);
  assert.equal(JSON.stringify(next.sections.filter((x) => x.id !== hero.id)), JSON.stringify(s.sections.filter((x) => x.id !== hero.id)));
});

test("markup in regenerated text is rejected by the section schema", () => {
  const bad = { badge: "Baru", title: "<img src=x>Kopi", description: "Deskripsi yang cukup panjang.", ctaLabel: "Pesan" };
  assert.equal(sectionCopySchema("hero-editorial").safeParse(bad).success, false);
});

test("item counts are enforced for lists", () => {
  assert.equal(sectionCopySchema("faq").safeParse({ heading: "FAQ", items: [{ question: "Satu pertanyaan?", answer: "Satu jawaban." }] }).success, false);
});

test("prompt carries the current text so the model writes something different", () => {
  const { user } = buildSectionPrompt(byType("cta-banner"), { brand: "Kopi", description: "Kedai kopi." });
  assert.ok(user.includes("Teks sekarang"));
  assert.ok(user.includes("Kopi"));
});

test("json is extracted from a noisy reply", () => {
  assert.deepEqual(extractJsonObject("Ini hasilnya: {\"a\":1} semoga membantu"), { a: 1 });
});
