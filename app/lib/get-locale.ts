import "server-only";
import { cookies } from "next/headers";
import { defaultLocale, type Locale } from "@/app/lib/i18n-config";

export async function getLocaleFromCookie(): Promise<Locale> {
  const cookieStore = await cookies();
  const loc = cookieStore.get("tabsy_locale")?.value;
  return loc === "fr" || loc === "en" ? (loc as Locale) : defaultLocale;
}
