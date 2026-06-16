import { NextResponse, type NextRequest } from "next/server";
import { MEMBER_COOKIE, ADMIN_COOKIE } from "@/lib/constants";

// Public paths that never require a session.
const PUBLIC = [
  "/enter",
  "/offline",
  "/admin/login",
  "/api/auth",
  "/api/admin-auth",
  "/api/bible", // public-domain Scripture, kept cacheable + offline-friendly
];

function isPublic(pathname: string) {
  return PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Cheap cookie-presence gate (Next.js 16 "proxy"). This is NOT the security
 * boundary — the encrypted session is verified in server components / route
 * handlers / server actions.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const hasMember = req.cookies.has(MEMBER_COOKIE);
  const hasAdmin = req.cookies.has(ADMIN_COOKIE);

  if (pathname.startsWith("/admin")) {
    if (!hasAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasMember && !hasAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/enter";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|icons|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webmanifest|json)$).*)",
  ],
};
