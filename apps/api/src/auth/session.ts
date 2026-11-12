import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed session tokens: base64url(payload).base64url(HMAC-SHA256(payload)).
 * Stateless, so no session table is needed. Logout clears the cookie on the client.
 */
export const SESSION_COOKIE = "wl_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const MIN_SECRET_LENGTH = 32;

function assertSecret(secret: string): void {
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }
}

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function signSession(userId: string, secret: string, nowMs: number = Date.now()): string {
  assertSecret(secret);
  const body = Buffer.from(JSON.stringify({ uid: userId, exp: nowMs + SESSION_TTL_MS })).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

/** Returns the user id if the token is authentic and not expired, otherwise null. */
export function verifySession(token: string, secret: string, nowMs: number = Date.now()): string | null {
  if (secret.length < MIN_SECRET_LENGTH) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;

  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { uid?: unknown; exp?: unknown };
    if (typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp <= nowMs) return null;
    return payload.uid;
  } catch {
    return null;
  }
}

/** Reads one cookie value from a raw Cookie header. */
export function readCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}
