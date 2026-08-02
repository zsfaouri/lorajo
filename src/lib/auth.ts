import { cookies } from "next/headers";

import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  getSessionSecret,
  tokenVersionFor,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session";

export {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  getSessionSecret,
  tokenVersionFor,
  verifySessionToken,
};
export type { SessionPayload };

export async function setSessionCookie(email: string, version: string) {
  const token = await createSessionToken(email, version);
  if (!token) throw new Error("ADMIN_SECRET is not configured");
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Signature/expiry check only. Revocation is enforced in withAdmin (needs DB). */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}
