/**
 * Shared admin session logic — Edge-safe (Web Crypto only, no Node APIs).
 * Imported by BOTH src/middleware.ts and src/lib/auth.ts so the two can never drift.
 *
 * Token format: base64( email : issuedAt : tokenVersion : hmacSignature )
 *
 * tokenVersion is derived from the user's password hash, so changing the
 * password invalidates every previously issued session.
 */

export const SESSION_COOKIE = "lora_admin_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

const INSECURE_DEFAULTS = new Set([
  "lora-admin-secret-change-me",
  "changeme",
  "secret",
  "",
]);

/**
 * Returns the signing secret, or null when none is configured.
 * There is deliberately NO fallback value: without a real secret, sessions
 * cannot be minted or verified, so the admin fails closed instead of
 * accepting tokens anyone could forge from the public source code.
 */
export function getSessionSecret(): string | null {
  const secret = process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "";
  if (!secret || INSECURE_DEFAULTS.has(secret) || secret.length < 16) return null;
  return secret;
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

/**
 * Constant-time string comparison.
 * Compares HMACs of both values so the loop always runs over equal-length,
 * fixed-size digests and leaks no information through timing.
 */
async function safeEqual(secret: string, a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([hmac(secret, a), hmac(secret, b)]);
  if (ha.length !== hb.length) return false;
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

/** Short fingerprint of the stored password hash — changes when the password changes. */
export async function tokenVersionFor(passwordHash: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(passwordHash),
  );
  return toHex(digest).slice(0, 12);
}

export type SessionPayload = { email: string; version: string };

export async function createSessionToken(
  email: string,
  version: string,
): Promise<string | null> {
  const secret = getSessionSecret();
  if (!secret) return null;
  const payload = `${email}:${Date.now()}:${version}`;
  const sig = await hmac(secret, payload);
  return btoa(`${payload}:${sig}`);
}

/**
 * Verifies signature and expiry. Returns the payload, or null when the token
 * is missing, malformed, expired, tampered with, or no secret is configured.
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length !== 4) return null;

    const [email, issuedAtRaw, version, sig] = parts;
    const payload = `${email}:${issuedAtRaw}:${version}`;

    const expected = await hmac(secret, payload);
    if (!(await safeEqual(secret, expected, sig))) return null;

    const issuedAt = Number.parseInt(issuedAtRaw, 10);
    if (!Number.isFinite(issuedAt)) return null;
    if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

    return { email, version };
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
