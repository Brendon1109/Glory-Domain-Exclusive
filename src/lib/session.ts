import "server-only";
import type { SessionOptions } from "iron-session";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MEMBER_COOKIE, ADMIN_COOKIE } from "./constants";

// iron-session requires a password of at least 32 characters. In production
// SESSION_SECRET must be set; the fallback only keeps local dev/build working.
const password =
  process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : "gd_dev_only_insecure_secret_change_me_0123456789";

export { MEMBER_COOKIE, ADMIN_COOKIE };

export type MemberSession = { member?: boolean };
export type AdminSession = { admin?: boolean };

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Both sessions last 30 days. ttl must be set alongside the cookie maxAge:
// iron-session's seal expires after 14 days by default regardless of the cookie.
const memberOptions: SessionOptions = {
  password,
  cookieName: MEMBER_COOKIE,
  ttl: 60 * 60 * 24 * 30,
  cookieOptions: { ...baseCookieOptions, maxAge: 60 * 60 * 24 * 30 },
};

const adminOptions: SessionOptions = {
  password,
  cookieName: ADMIN_COOKIE,
  ttl: 60 * 60 * 24 * 30,
  cookieOptions: { ...baseCookieOptions, maxAge: 60 * 60 * 24 * 30 },
};

export async function getMemberSession() {
  return getIronSession<MemberSession>(await cookies(), memberOptions);
}

export async function getAdminSession() {
  return getIronSession<AdminSession>(await cookies(), adminOptions);
}

export async function isMember() {
  const [m, a] = await Promise.all([getMemberSession(), getAdminSession()]);
  return Boolean(m.member || a.admin);
}

export async function isAdmin() {
  return Boolean((await getAdminSession()).admin);
}

/**
 * The lock for every admin page. Call it as the first line of each page, not
 * only in the layout. On an RSC request Next can render a page without
 * running the layout above it, and the proxy only checks that a cookie with
 * the right name exists, so a layout check alone does not protect a page's
 * data. The layout check stays as the courtesy redirect.
 */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
