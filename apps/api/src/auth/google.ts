import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Google sign-in (OpenID Connect, authorization code flow).
 * The code is exchanged on the server, so the client secret never reaches the browser.
 */

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const VALID_ISSUERS = ["https://accounts.google.com", "accounts.google.com"];
const STATE_TTL_MS = 10 * 60 * 1000;

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export function buildAuthUrl(cfg: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Signed, short-lived state. It stops forged callbacks and binds one login attempt to one redirect. */
export function signState(secret: string, nowMs: number = Date.now()): string {
  const body = Buffer.from(JSON.stringify({ n: randomUUID(), exp: nowMs + STATE_TTL_MS })).toString("base64url");
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
}

export function verifyState(state: string, secret: string, nowMs: number = Date.now()): boolean {
  const [body, sig, extra] = state.split(".");
  if (!body || !sig || extra !== undefined) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("base64url"));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as { exp?: unknown };
    return typeof payload.exp === "number" && payload.exp > nowMs;
  } catch {
    return false;
  }
}

export interface GoogleClaims {
  iss?: string;
  aud?: string;
  exp?: number;
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
}

/**
 * Checks the claims that matter. The token comes straight from Google's token endpoint over
 * TLS, so the OIDC rules allow skipping the JWT signature check here.
 */
export function validateClaims(claims: GoogleClaims, clientId: string, nowMs: number = Date.now()): string {
  if (!claims.iss || !VALID_ISSUERS.includes(claims.iss)) throw new Error("Issuer tidak valid");
  if (claims.aud !== clientId) throw new Error("Audience tidak valid");
  if (typeof claims.exp !== "number" || claims.exp * 1000 <= nowMs) throw new Error("Token kedaluwarsa");
  if (!claims.email || claims.email_verified !== true) throw new Error("Email Google belum terverifikasi");
  return claims.email.trim().toLowerCase();
}

export function decodeIdToken(idToken: string): GoogleClaims {
  const parts = idToken.split(".");
  if (parts.length !== 3 || !parts[1]) throw new Error("ID token tidak valid");
  return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as GoogleClaims;
}

/** Server-to-server exchange of the authorization code for tokens. */
export async function exchangeCode(
  cfg: GoogleConfig,
  code: string,
  fetchImpl: (url: string, init: RequestInit) => Promise<Response> = (u, i) => fetch(u, i),
): Promise<GoogleClaims> {
  const res = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google token exchange gagal (${res.status})`);
  const data = (await res.json()) as { id_token?: string };
  if (!data.id_token) throw new Error("Google tidak mengembalikan ID token");
  return decodeIdToken(data.id_token);
}
