import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "radiofy_auth_token";

const PUBLIC_PATHS = new Set([
  "/login",
  "/register",
  "/home",
  "/features",
  "/pricing",
  "/about",
  "/contact",
  "/help",
  "/terms",
  "/privacy",
]);
const PUBLIC_PREFIXES = [
  "/player/",
  "/api/auth/login",
  "/api/auth/register",
  "/api/billing/webhooks",
  "/api/public/",
  "/api/files/",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (pathname === "/" && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.rewrite(url);
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
