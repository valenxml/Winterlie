import { test } from "node:test";
import assert from "node:assert/strict";
import { RateLimiter } from "./rate-limit.js";

const MIN = 60_000;

test("requests beyond the limit are blocked within the window", () => {
  const rl = new RateLimiter(3, 10 * MIN);
  const t = 1_000_000;
  assert.equal(rl.hit("ip", t).allowed, true);
  assert.equal(rl.hit("ip", t + 1).allowed, true);
  assert.equal(rl.hit("ip", t + 2).allowed, true);
  const blocked = rl.hit("ip", t + 3);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test("the window slides, so old hits stop counting", () => {
  const rl = new RateLimiter(2, 10 * MIN);
  const t = 1_000_000;
  rl.hit("ip", t);
  rl.hit("ip", t + 1);
  assert.equal(rl.hit("ip", t + 2).allowed, false);
  assert.equal(rl.hit("ip", t + 10 * MIN + 2).allowed, true);
});

test("different keys have separate budgets", () => {
  const rl = new RateLimiter(1, 10 * MIN);
  const t = 1_000_000;
  assert.equal(rl.hit("user-a", t).allowed, true);
  assert.equal(rl.hit("user-b", t).allowed, true);
  assert.equal(rl.hit("user-a", t + 1).allowed, false);
});

test("retry time points to when the oldest hit leaves the window", () => {
  const rl = new RateLimiter(1, 10 * MIN);
  const t = 1_000_000;
  rl.hit("ip", t);
  const r = rl.hit("ip", t + MIN);
  assert.equal(r.retryAfterMs, 9 * MIN);
});

test("prune removes idle keys", () => {
  const rl = new RateLimiter(1, MIN);
  rl.hit("old", 0);
  rl.prune(10 * MIN);
  assert.equal(rl.hit("old", 10 * MIN).allowed, true);
});
