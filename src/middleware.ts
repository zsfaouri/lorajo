import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "lora_admin_session";
const SECRET = process.env.ADMIN_SECRET || process.env.AUTH_SECRET || "lora-admin-secret-change-me";

async function verifyToken(token: string): Promise<boolean> {
  try {
    const decoded = atob(token);
    const parts = decoded.split(":");
    if (parts.length < 3) return false;

    const sig = parts.pop()!;
    const payload = parts.join(":");
    const timestampStr = parts[parts.length - 1];

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const expected = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expected))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedHex !== sig) return false;

    const timestamp = parseInt(timestampStr, 10);
    if (Date.now() - timestamp > 7 * 24 * 60 * 60 * 1000) return false;

    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root redirect (unchanged behavior)
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url, 308);
  }

  // Protect admin routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (pathname === "/admin/login" || pathname === "/api/admin/auth/login") {
      return NextResponse.next();
    }

    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token || !(await verifyToken(token))) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
