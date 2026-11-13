import { test } from "node:test";
import assert from "node:assert/strict";
import { buildAuthUrl, decodeIdToken, signState, validateClaims, verifyState, type GoogleClaims } from "./google.js";

const CFG = { clientId: "abc.apps.googleusercontent.com", clientSecret: "shh", redirectUri: "http://localhost:4000/auth/google/callback" };
const SECRET = "s".repeat(40);
const NOW = 1_800_000_000_000;
const good: GoogleClaims = { iss: "https://accounts.google.com", aud: CFG.clientId, exp: NOW / 1000 + 600, email: "Eko@Gmail.com", email_verified: true, sub: "1" };

test("auth URL asks for openid, email, profile and carries the state", () => {
  const url = new URL(buildAuthUrl(CFG, "st"));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("client_id"), CFG.clientId);
  assert.equal(url.searchParams.get("scope"), "openid email profile");
  assert.equal(url.searchParams.get("state"), "st");
});

test("state verifies once signed, and fails when tampered or expired", () => {
  const st = signState(SECRET, NOW);
  assert.equal(verifyState(st, SECRET, NOW + 1000), true);
  assert.equal(verifyState(st, "x".repeat(40), NOW + 1000), false);
  assert.equal(verifyState(st, SECRET, NOW + 11 * 60 * 1000), false);
  const [body, sig] = st.split(".");
  const forged = Buffer.from(JSON.stringify({ n: "x", exp: NOW + 999999 })).toString("base64url");
  assert.equal(verifyState(`${forged}.${sig}`, SECRET, NOW), false);
});

test("valid claims return the normalised email", () => {
  assert.equal(validateClaims(good, CFG.clientId, NOW), "eko@gmail.com");
});

test("wrong audience, issuer, or expired token are rejected", () => {
  assert.throws(() => validateClaims({ ...good, aud: "lain" }, CFG.clientId, NOW), /Audience/);
  assert.throws(() => validateClaims({ ...good, iss: "https://evil.example" }, CFG.clientId, NOW), /Issuer/);
  assert.throws(() => validateClaims({ ...good, exp: NOW / 1000 - 1 }, CFG.clientId, NOW), /kedaluwarsa/);
});

test("an unverified Google email is never accepted", () => {
  assert.throws(() => validateClaims({ ...good, email_verified: false }, CFG.clientId, NOW), /terverifikasi/);
});

test("id token payload is decoded from the JWT middle segment", () => {
  const payload = Buffer.from(JSON.stringify(good)).toString("base64url");
  const token = `header.${payload}.sig`;
  assert.equal(decodeIdToken(token).email, "Eko@Gmail.com");
  assert.throws(() => decodeIdToken("bukan-jwt"));
});
