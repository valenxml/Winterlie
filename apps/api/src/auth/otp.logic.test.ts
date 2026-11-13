import { test } from "node:test";
import assert from "node:assert/strict";
import { codeMatches, cooldownRemaining, generateCode, hashCode, isExpired, OTP_COOLDOWN_MS } from "./otp.logic.js";

const SECRET = "s".repeat(40);

test("codes are always six digits", () => {
  for (let i = 0; i < 200; i++) assert.match(generateCode(), /^\d{6}$/);
});

test("the right code matches, a wrong code does not", () => {
  const h = hashCode("123456", "a@b.com", SECRET);
  assert.equal(codeMatches("123456", "a@b.com", SECRET, h), true);
  assert.equal(codeMatches("654321", "a@b.com", SECRET, h), false);
});

test("a code is bound to its email", () => {
  const h = hashCode("123456", "a@b.com", SECRET);
  assert.equal(codeMatches("123456", "lain@b.com", SECRET, h), false);
});

test("email case does not change the hash", () => {
  assert.equal(hashCode("123456", "A@B.com", SECRET), hashCode("123456", "a@b.com", SECRET));
});

test("expiry and cooldown are computed from the clock", () => {
  const now = 1_000_000;
  assert.equal(isExpired(new Date(now - 1), now), true);
  assert.equal(isExpired(new Date(now + 1), now), false);
  assert.equal(cooldownRemaining(null, now), 0);
  assert.equal(cooldownRemaining(new Date(now), now), OTP_COOLDOWN_MS);
  assert.equal(cooldownRemaining(new Date(now - OTP_COOLDOWN_MS - 1), now), 0);
});
