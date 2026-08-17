// Shared between server and client — no "server-only" here
export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

import { cookies } from "next/headers";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export async function getLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const loc = cookieStore.get("tabsy_locale")?.value;
  return loc === "fr" || loc === "en" ? (loc as Locale) : defaultLocale;
}
