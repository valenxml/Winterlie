import { test } from "node:test";
import assert from "node:assert/strict";
import { canAfford, dailyKey, sumBalance, GENERATE_COST, SIGNUP_BONUS } from "./credits.logic.js";

test("the daily key changes at midnight WIB, not UTC", () => {
  // 2026-11-12 16:30 UTC is 23:30 WIB on the 12th
  assert.equal(dailyKey(new Date("2026-11-12T16:30:00Z")), "2026-11-12");
  // 2026-11-12 17:30 UTC is 00:30 WIB on the 13th
  assert.equal(dailyKey(new Date("2026-11-12T17:30:00Z")), "2026-11-13");
});

test("balance is the sum of ledger entries, including refunds and deductions", () => {
  assert.equal(sumBalance([SIGNUP_BONUS, -GENERATE_COST, 1, GENERATE_COST]), SIGNUP_BONUS + 1);
  assert.equal(sumBalance([]), 0);
});

test("a user with zero credits cannot afford a generate", () => {
  assert.equal(canAfford(0, GENERATE_COST), false);
  assert.equal(canAfford(GENERATE_COST, GENERATE_COST), true);
});
