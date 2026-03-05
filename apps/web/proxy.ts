import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, locales } from "./lib/i18n";

const COOKIE_NAME = "happynachbar_token";

// Normalize paths so "/activity/" behaves like "/activity" (but keep "/" as-is)
function normalizePath(pathname: string) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "");
}

function hasLocalePrefix(pathname: string) {
  return locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
}

function getLocaleFromPath(pathname: string) {
  const match = locales.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  return match ?? defaultLocale;
}

function stripLocalePrefix(pathname: string) {
  const locale = getLocaleFromPath(pathname);
  if (pathname === `/${locale}`) return "/";
  if (pathname.startsWith(`/${locale}/`)) {
    return pathname.slice(locale.length + 1);
  }
  return pathname;
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return atob(`${normalized}${padding}`);
}

function getJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenExpired(token: string) {
  const exp = getJwtExp(token);
  if (!exp) return true;
  return Date.now() >= exp * 1000;
}

function withClearedTokenCookie(res: NextResponse, shouldClear: boolean) {
  if (!shouldClear) return res;
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    path: "/",
    maxAge: 0,
  });
  return res;
}

// List of public routes (no login redirect needed)
const PUBLIC_PATHS = new Set<string>([
  "/", // landing page
  "/auth/login", // login page
  "/auth/register", // register page
  "/auth/forgot", // forgot password page
  "/auth/reset", // reset password page (link from email)
  "/teaser", // activity teaser page
  "/auth/verify",
]);

function buildRedirect(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

// middleware() -> proxy()
export function proxy(req: NextRequest) {
  const pathname = normalizePath(req.nextUrl.pathname);
  if (!hasLocalePrefix(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = getLocaleFromPath(pathname);
  const pathWithoutLocale = stripLocalePrefix(pathname);
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const tokenExpired = token ? isTokenExpired(token) : false;
  const isLoggedIn = !!token && !tokenExpired;

  // If already logged in, never show login page
  if (isLoggedIn && pathWithoutLocale === "/auth/login") {
    return withClearedTokenCookie(
      buildRedirect(req, `/${locale}/homepage`),
      tokenExpired,
    );
  }

  // If already logged in, never show landing page
  if (isLoggedIn && pathWithoutLocale === "/") {
    return withClearedTokenCookie(
      buildRedirect(req, `/${locale}/homepage`),
      tokenExpired,
    );
  }

  // If already logged in, skip the public teaser funnel and go straight to the homepage
  if (isLoggedIn && pathWithoutLocale === "/activity") {
    return withClearedTokenCookie(
      buildRedirect(req, `/${locale}/homepage`),
      tokenExpired,
    );
  }

  // Allow public routes
  if (PUBLIC_PATHS.has(pathWithoutLocale)) {
    return withClearedTokenCookie(NextResponse.next(), tokenExpired);
  }

  // All other routes require auth
  if (!isLoggedIn) {
    return withClearedTokenCookie(
      buildRedirect(req, `/${locale}/auth/login`),
      tokenExpired,
    );
  }

  return withClearedTokenCookie(NextResponse.next(), tokenExpired);
}

/**
 * Run proxy for "all pages" but skip Next internals + static files.
 */
export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
