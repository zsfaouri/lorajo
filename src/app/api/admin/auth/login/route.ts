import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getPrisma } from "@/lib/prisma";
import {
  SESSION_COOKIE,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
  getSessionSecret,
  tokenVersionFor,
} from "@/lib/session";

/**
 * Brute-force protection: per-IP sliding window.
 * In-memory, so the limit is per serverless instance rather than global —
 * it still raises the cost of guessing by orders of magnitude, and the
 * bcrypt cost factor (12) does the heavy lifting.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (attempts.size > 5000) attempts.clear(); // crude memory bound

  if (recent.length >= MAX_ATTEMPTS) {
    attempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  attempts.set(ip, recent);
  return false;
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

export async function POST(req: NextRequest) {
  try {
    if (!getSessionSecret()) {
      console.error("Login blocked: ADMIN_SECRET (or AUTH_SECRET) is not configured.");
      return NextResponse.json(
        { error: "Server is not configured for admin sign-in. Set ADMIN_SECRET." },
        { status: 503 },
      );
    }

    const ip = clientIp(req);
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many sign-in attempts. Please try again later." },
        { status: 429 },
      );
    }

    const { email, password } = await req.json();
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const prisma = getPrisma();
    if (!prisma) {
      return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const admin = await prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    // Always run a bcrypt comparison so response time does not reveal
    // whether the account exists.
    const hash = admin?.passwordHash ?? "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin";
    const valid = await bcrypt.compare(password, hash);

    if (!admin || !valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const version = await tokenVersionFor(admin.passwordHash);
    const token = await createSessionToken(admin.email, version);
    if (!token) {
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 503 });
    }

    clearAttempts(ip);

    const response = NextResponse.json({ ok: true, email: admin.email, name: admin.name });
    response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
