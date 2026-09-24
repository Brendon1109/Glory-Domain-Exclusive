import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE } from "@/lib/constants";

/**
 * The member-facing app is open to anyone with the link. Only the pastor admin
 * area requires a session (a cheap cookie-presence check here; the encrypted
 * session is verified by requireAdmin() on every admin page).
 *
 * This is middleware.ts on the edge runtime on purpose, not Next 16's
 * proxy.ts. proxy.ts only runs on Node, and Node middleware is still
 * experimental in the Cloudflare adapter, while edge middleware runs on both
 * Vercel and Workers. Next 16 marks the middleware name deprecated but still
 * supports it, and its docs say to keep it for the edge runtime.
 */
export function middleware(req: NextRequest) {
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
