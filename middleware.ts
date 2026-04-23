import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Leichte Middleware: Auth.js v5 pr\xfcft echte Session in Route-Handlern.
// Hier pr\xfcfen wir nur, ob ein Session-Cookie vorhanden ist - echte
// Autorisierung erfolgt via requireWorkspace() in den jeweiligen Pages.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const sessionCookie =
    req.cookies.get("authjs.session-token")?.value ??
    req.cookies.get("__Secure-authjs.session-token")?.value;

  const isAppRoute = pathname.startsWith("/app") || pathname.startsWith("/onboarding");
  const isAdminRoute = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");

  if (isAppRoute && !sessionCookie) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
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
  matcher: ["/app/:path*", "/onboarding", "/admin/:path*"],
};
