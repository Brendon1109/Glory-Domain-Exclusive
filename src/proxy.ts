import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";

/**
 * The member-facing app is open to anyone with the link. Only the pastor admin
 * area requires a session (a cheap cookie-presence check here; the encrypted
 * session is verified in the admin layout).
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.has(ADMIN_COOKIE)) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
