import { test } from "node:test";
import assert from "node:assert/strict";
import { coffeeLanding } from "./fixtures.js";
import { designSpecSchema } from "./design.js";
import { isSafeHref } from "./primitives.js";
import {
  addSection, changedSectionIds, DesignOperationError, moveSection, removeSection, replaceSection,
} from "./operations.js";

const newHero = (id = "hero") => ({
  id, type: "hero-split",
  content: {
    title: "Slow mornings, strong coffee",
    description: "A roastery and bar built around one good cup.",
    primaryCta: { label: "Visit us", href: "#visit" },
    image: { kind: "placeholder", label: "Roastery interior", aspect: "16:9" },
  },
  settings: { imagePosition: "left", emphasis: "image" },
});

test("valid fixture passes the schema", () => {
  assert.equal(designSpecSchema.safeParse(coffeeLanding()).success, true);
});

test("markup in text is rejected", () => {
  const spec = coffeeLanding();
  (spec.sections[1] as any).content.title = "<script>alert(1)</script>";
  assert.equal(designSpecSchema.safeParse(spec).success, false);
});

test("unsafe hrefs are rejected", () => {
  assert.equal(isSafeHref("javascript:alert(1)"), false);
  assert.equal(isSafeHref("//evil.com"), false);
  assert.equal(isSafeHref("data:text/html,x"), false);
  assert.equal(isSafeHref("#menu"), true);
  assert.equal(isSafeHref("/about"), true);
  assert.equal(isSafeHref("https://example.com"), true);
});

test("unknown section types and hex colors are rejected", () => {
  const a = coffeeLanding();
  (a.sections[0] as any).type = "custom-html";
  assert.equal(designSpecSchema.safeParse(a).success, false);
  const b = coffeeLanding();
  b.tokens.colors.primary = "red";
  assert.equal(designSpecSchema.safeParse(b).success, false);
});

test("duplicate ids and category mismatches are rejected", () => {
  const dup = coffeeLanding();
  (dup.sections[2] as any).id = "hero";
  assert.equal(designSpecSchema.safeParse(dup).success, false);
  const wrongCat = { ...coffeeLanding(), category: "dashboard" };
  assert.equal(designSpecSchema.safeParse(wrongCat).success, false);
});

test("dashboard table rows must match column count", () => {
  const spec = {
    ...coffeeLanding(), category: "dashboard",
    sections: [{
      id: "tbl", type: "dashboard-table",
      content: { title: "Bookings", columns: ["Court", "Time"], rows: [["A", "10:00"], ["B"]] },
      settings: { striped: true, density: "compact" },
    }],
  };
  assert.equal(designSpecSchema.safeParse(spec).success, false);
});

test("replaceSection changes only the target section", () => {
  const before = designSpecSchema.parse(coffeeLanding());
  const after = replaceSection(before, "hero", newHero());
  assert.deepEqual(changedSectionIds(before, after), ["hero"]);
  assert.equal(JSON.stringify(after.sections[0]), JSON.stringify(before.sections[0]));
  assert.equal(JSON.stringify(after.sections[2]), JSON.stringify(before.sections[2]));
  assert.deepEqual(after.tokens, before.tokens);
  assert.equal(after.sections[1]?.type, "hero-split");
  // original is not mutated
  assert.equal(before.sections[1]?.type, "hero-editorial");
});

test("replaceSection rejects id changes, invalid sections and unknown ids", () => {
  const spec = designSpecSchema.parse(coffeeLanding());
  assert.throws(() => replaceSection(spec, "hero", newHero("other")), DesignOperationError);
  assert.throws(() => replaceSection(spec, "hero", { id: "hero", type: "hero-split" }));
  assert.throws(() => replaceSection(spec, "missing", newHero("missing")), DesignOperationError);
});

test("move, remove and add keep the spec valid", () => {
  const spec = designSpecSchema.parse(coffeeLanding());
  assert.deepEqual(moveSection(spec, "faq", 0).sections.map((s) => s.id), ["faq", "nav", "hero"]);
  assert.deepEqual(removeSection(spec, "faq").sections.map((s) => s.id), ["nav", "hero"]);
  assert.deepEqual(addSection(spec, newHero("hero-2"), 1).sections.map((s) => s.id), ["nav", "hero-2", "hero", "faq"]);
  assert.throws(() => addSection(spec, newHero("hero")));
  assert.throws(() => moveSection(spec, "faq", 9), DesignOperationError);
});
