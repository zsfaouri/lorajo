import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/en";
  return NextResponse.redirect(url, 308);
}

export const config = {
  matcher: "/",
};
