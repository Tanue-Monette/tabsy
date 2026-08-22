import { NextRequest, NextResponse } from "next/server";
import Negotiator from "negotiator";
import { match } from "@formatjs/intl-localematcher";
import { decrypt } from "@/app/lib/session";
import { decryptAdminSession } from "@/app/lib/admin-session";
import { locales, defaultLocale, type Locale } from "@/app/lib/i18n-config";

const COOKIE_NAME = "tabsy_session";
const ADMIN_COOKIE_NAME = "tabsy_admin_session";
const LOCALE_COOKIE = "tabsy_locale";

const PUBLIC_PATHS = ["/", "/register", "/forgot-pin", "/reset-pin"];

function getLocale(request: NextRequest): Locale {
  // 1. Check cookie preference first
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Negotiate from Accept-Language header
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value;
  });
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  try {
    return match(languages, [...locales], defaultLocale) as Locale;
  } catch {
    return defaultLocale;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and internal paths
  const isStatic =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/manifest") ||
    pathname.includes("/icon") ||
    /\.(png|svg|ico|jpg|jpeg|webp|json|js|css|woff|woff2)$/.test(pathname) ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest";

  if (isStatic) return NextResponse.next();

  // Handle Admin Routes
  if (pathname.startsWith("/admin")) {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const adminSession = adminToken ? await decryptAdminSession(adminToken) : null;
    const isAdminAuthenticated = !!adminSession && new Date(adminSession.expiresAt) > new Date();

    const isAdminLogin = pathname === "/admin/login";

    if (isAdminAuthenticated && isAdminLogin) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    if (!isAdminAuthenticated && !isAdminLogin) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return NextResponse.next();
  }

  // Check if pathname already has a locale prefix
  const pathnameLocale = locales.find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  );

  // If no locale in path, redirect to add one
  if (!pathnameLocale) {
    const locale = getLocale(request);
    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(newUrl);
  }

  const locale = pathnameLocale;
  // Path without the locale prefix
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  const isPublicRoute = PUBLIC_PATHS.includes(pathWithoutLocale);

  // Auth check
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const session = token ? await decrypt(token) : null;
  const isAuthenticated = !!session && new Date(session.expiresAt) > new Date();

  // For suspended merchants, we could check their status in a server layout/page.
  // Middleware handles basic token presence.
  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  if (!isAuthenticated && !isPublicRoute) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon|icon-512|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)",
  ],
};
