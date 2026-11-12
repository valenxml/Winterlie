import { test } from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL, LIMITS, applyPatch, deriveTheme, historyReducer, initialHistory, sanitizeText,
} from "./preview-state.js";

test("markup characters are stripped from text", () => {
  assert.equal(sanitizeText("<script>x</script>", 100), "scriptx/script");
});

test("text is capped at the schema limit", () => {
  const long = "a".repeat(500);
  const s = applyPatch(INITIAL, { title: long });
  assert.equal(s.title.length, LIMITS.title);
});

test("undo and redo move through edits", () => {
  let h = initialHistory();
  h = historyReducer(h, { type: "edit", patch: { brand: "Kopi Baru" } });
  h = historyReducer(h, { type: "edit", patch: { ctaLabel: "Pesan" } });
  assert.equal(h.present.ctaLabel, "Pesan");
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present.ctaLabel, INITIAL.ctaLabel);
  assert.equal(h.present.brand, "Kopi Baru");
  h = historyReducer(h, { type: "redo" });
  assert.equal(h.present.ctaLabel, "Pesan");
});

test("edits with the same key merge into one undo step", () => {
  let h = initialHistory();
  for (const t of ["K", "Ko", "Kop", "Kopi"]) {
    h = historyReducer(h, { type: "edit", patch: { brand: t }, key: "brand" });
  }
  assert.equal(h.past.length, 1);
  h = historyReducer(h, { type: "undo" });
  assert.equal(h.present.brand, INITIAL.brand);
});

test("a new edit clears redo history", () => {
  let h = initialHistory();
  h = historyReducer(h, { type: "edit", patch: { align: "center" } });
  h = historyReducer(h, { type: "undo" });
  h = historyReducer(h, { type: "edit", patch: { font: "poster" } });
  assert.equal(h.future.length, 0);
});

test("no-op edits do not create history entries", () => {
  const h = historyReducer(initialHistory(), { type: "edit", patch: { brand: INITIAL.brand } });
  assert.equal(h.past.length, 0);
});

test("reset returns to the initial state", () => {
  let h = historyReducer(initialHistory(), { type: "edit", patch: { title: "Lain" } });
  h = historyReducer(h, { type: "reset" });
  assert.equal(h.present.title, INITIAL.title);
});

test("theme derives valid palette colors from the chosen preset", () => {
  const t = deriveTheme({ ...INITIAL, preset: "violet", font: "sans" });
  assert.match(t.palette.primary, /^#[0-9A-F]{6}$/);
  assert.equal(t.headingFamily, "Space Grotesk");
  assert.ok(t.headingStack.startsWith('"Space Grotesk"'));
});
