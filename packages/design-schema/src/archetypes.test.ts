import { test } from "node:test";
import assert from "node:assert/strict";
import { archetypeSpecs, pickArchetype } from "./archetypes.js";
import { designSpecSchema } from "./design.js";

test("the brief decides the archetype", () => {
  assert.equal(pickArchetype("Saya ingin jual baju online dengan keranjang belanja"), "ecommerce");
  assert.equal(pickArchetype("Website game catur online dengan peringkat"), "game");
  assert.equal(pickArchetype("Layanan streaming film dan serial"), "streaming");
  assert.equal(pickArchetype("Jasa desain interior untuk rumah"), "landing");
});

test("each archetype produces three valid, different specs", () => {
  const cases = [
    ["Toko sepatu online dengan produk lokal", "ecommerce", ["product-grid"]],
    ["Website game catur dengan turnamen", "game", ["stats-row"]],
    ["Layanan streaming film dan serial", "streaming", ["pricing"]],
  ] as const;
  for (const [brief, expected, mustHave] of cases) {
    const { archetype, specs } = archetypeSpecs(brief, "Brand Uji");
    assert.equal(archetype, expected, brief);
    assert.equal(specs.length, 3);
    for (const spec of specs) {
      assert.equal(designSpecSchema.safeParse(spec).success, true, `${expected}: ${spec.direction}`);
      for (const type of mustHave) assert.ok(spec.sections.some((s) => s.type === type), `${expected} needs ${type}`);
    }
    assert.equal(new Set(specs.map((s) => s.sections.map((x) => x.type).join(","))).size, 3);
  }
});

test("a game brief gets the pattern hero, not the coffee-shop layout", () => {
  const { specs } = archetypeSpecs("Website game catur online", "Catur Arena");
  const hero = specs[0]!.sections.find((s) => s.type.startsWith("hero-")) as any;
  assert.equal(hero.settings.visual, "pattern");
  assert.ok(!specs[0]!.sections.some((s) => s.type === "hero-editorial" && false));
});

test("an e-commerce brief has product cards and no streaming pricing", () => {
  const { specs } = archetypeSpecs("Jual kopi bubuk online", "Kopi Nusantara");
  assert.ok(specs.every((s) => s.sections.some((x) => x.type === "product-grid")));
  assert.ok(specs.every((s) => !s.sections.some((x) => x.type === "pricing")));
});

test("a long description is clipped and a short one still gets valid copy", () => {
  const long = archetypeSpecs("game ".repeat(200), "X".repeat(200));
  assert.ok(long.specs.every((s) => designSpecSchema.safeParse(s).success));
  const short = archetypeSpecs("game", "Ab");
  assert.ok(short.specs.every((s) => designSpecSchema.safeParse(s).success));
});

test("a chosen site type overrides the keyword guess", () => {
  const { archetype, specs } = archetypeSpecs("Website game catur online", "Toko Kopi", "ecommerce");
  assert.equal(archetype, "ecommerce");
  assert.ok(specs.every((s) => s.sections.some((x) => x.type === "product-grid")));
});

test("auto keeps the keyword guess", () => {
  assert.equal(archetypeSpecs("Layanan streaming film", "Nonton", "auto").archetype, "streaming");
});
