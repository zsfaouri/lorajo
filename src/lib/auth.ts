import { cookies } from "next/headers";

const COOKIE_NAME = "lora_admin_session";
const SECRET = process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "lora-admin-secret-change-me";

// Simple token: base64(email + ":" + timestamp + ":" + hmac)
// No external JWT library needed — we use Web Crypto API

async function hmacSign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(signature).toString("hex");
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const expected = await hmacSign(data);
  return expected === signature;
}

export async function createSessionToken(email: string): Promise<string> {
  const timestamp = Date.now().toString();
  const payload = `${email}:${timestamp}`;
  const sig = await hmacSign(payload);
  return Buffer.from(`${payload}:${sig}`).toString("base64");
}

export async function verifySessionToken(token: string): Promise<{ email: string } | null> {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const parts = decoded.split(":");
    if (parts.length < 3) return null;

    const sig = parts.pop()!;
    const payload = parts.join(":");
    const [email, timestampStr] = [parts.slice(0, -1).join(":"), parts[parts.length - 1]];

    if (!await hmacVerify(payload, sig)) return null;

    // Token expires after 7 days
    const timestamp = parseInt(timestampStr, 10);
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - timestamp > sevenDays) return null;

    return { email };
  } catch {
    return null;
  }
}

export async function setSessionCookie(email: string) {
  const token = await createSessionToken(email);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}
