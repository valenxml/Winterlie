import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

/** Pure rules for email codes. Kept free of database and network code so they can be tested. */
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Keyed hash bound to the email, so a stored code cannot be reused for another address. */
export function hashCode(code: string, email: string, secret: string): string {
  return createHmac("sha256", secret).update(`${email.toLowerCase()}:${code}`).digest("base64url");
}

export function codeMatches(code: string, email: string, secret: string, storedHash: string): boolean {
  const expected = Buffer.from(hashCode(code, email, secret));
  const actual = Buffer.from(storedHash);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function isExpired(expiresAt: Date, nowMs: number = Date.now()): boolean {
  return expiresAt.getTime() <= nowMs;
}

/** Milliseconds the user must still wait before a new code can be requested. */
export function cooldownRemaining(lastSentAt: Date | null, nowMs: number = Date.now()): number {
  if (!lastSentAt) return 0;
  return Math.max(0, lastSentAt.getTime() + OTP_COOLDOWN_MS - nowMs);
}
