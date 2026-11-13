import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateCostMicros, microsToRupiah, isTimeout } from "./usage.logic.js";

test("cost at Rp 300 per million tokens", () => {
  // 1 million tokens costs Rp 300 = 300,000,000 micro-rupiah
  assert.equal(estimateCostMicros(1_000_000, 300), 300_000_000);
  // a 6,000-token generate costs Rp 1.8
  assert.equal(microsToRupiah(estimateCostMicros(6000, 300)), 1.8);
});

test("zero, negative, or invalid inputs cost nothing", () => {
  assert.equal(estimateCostMicros(0, 300), 0);
  assert.equal(estimateCostMicros(-5, 300), 0);
  assert.equal(estimateCostMicros(100, 0), 0);
  assert.equal(estimateCostMicros(Number.NaN, 300), 0);
});

test("timeouts are recognised from the error message", () => {
  assert.equal(isTimeout("AI request timed out"), true);
  assert.equal(isTimeout("AI provider returned 503"), false);
});
