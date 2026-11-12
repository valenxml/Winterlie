import { test } from "node:test";
import assert from "node:assert/strict";
import { coffeeLanding } from "./fixtures.js";
import { applyDesignOp, designOpSchema, parseStoredSpec } from "./apply-op.js";
import { designSpecSchema } from "./design.js";

const base = () => designSpecSchema.parse(coffeeLanding());

test("replace changes only the target section text", () => {
  const spec = base();
  const hero = JSON.parse(JSON.stringify(spec.sections[1]));
  hero.content.title = "Kopi yang lebih pelan";
  const next = applyDesignOp(spec, { op: "replace", sectionId: "hero", section: hero });
  assert.equal((next.sections[1] as any).content.title, "Kopi yang lebih pelan");
  assert.equal(JSON.stringify(next.sections[0]), JSON.stringify(spec.sections[0]));
  assert.equal(JSON.stringify(next.tokens), JSON.stringify(spec.tokens));
});

test("replace rejects unsafe text, and the original is not mutated", () => {
  const spec = base();
  const hero = JSON.parse(JSON.stringify(spec.sections[1]));
  hero.content.title = "<img src=x onerror=alert(1)>";
  assert.throws(() => applyDesignOp(spec, { op: "replace", sectionId: "hero", section: hero }));
  assert.equal((spec.sections[1] as any).content.title, "Coffee, Crafted Slowly");
});

test("move and remove keep the spec valid", () => {
  const spec = base();
  assert.deepEqual(applyDesignOp(spec, { op: "move", sectionId: "faq", toIndex: 0 }).sections.map((s) => s.id), ["faq", "nav", "hero"]);
  assert.deepEqual(applyDesignOp(spec, { op: "remove", sectionId: "faq" }).sections.map((s) => s.id), ["nav", "hero"]);
});

test("unknown section ids are rejected", () => {
  assert.throws(() => applyDesignOp(base(), { op: "remove", sectionId: "missing" }));
});

test("op schema rejects malformed input", () => {
  assert.equal(designOpSchema.safeParse({ op: "move", sectionId: "hero", toIndex: -1 }).success, false);
  assert.equal(designOpSchema.safeParse({ op: "explode", sectionId: "hero" }).success, false);
  assert.equal(designOpSchema.safeParse({ op: "remove", sectionId: "hero" }).success, true);
});

test("stored specs are re-validated on read", () => {
  assert.throws(() => parseStoredSpec({ schemaVersion: 1, name: "x" }));
  assert.equal(parseStoredSpec(coffeeLanding()).name, "Coffee Studio");
});
