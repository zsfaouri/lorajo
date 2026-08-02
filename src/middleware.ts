import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

const PUBLIC_ADMIN_PATHS = new Set(["/admin/login", "/api/admin/auth/login"]);

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Root locale redirect (unchanged public behaviour)
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/en";
    return NextResponse.redirect(url, 308);
  }

  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdmin || PUBLIC_ADMIN_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/api/admin/:path*"],
};
