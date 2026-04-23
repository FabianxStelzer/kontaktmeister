import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/login",
  "/register",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/admin/login",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/p/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const isAppRoute = pathname.startsWith("/app") || pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAppRoute) {
    const sessionCookie =
      req.cookies.get("authjs.session-token")?.value ??
      req.cookies.get("__Secure-authjs.session-token")?.value;
    if (!sessionCookie) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (isAdminRoute) {
    const superCookie = req.cookies.get("km_super")?.value;
    if (!superCookie) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|p/).*)",
  ],
};
