export { locales, defaultLocale, isValidLocale } from "./i18n-config";
export type { Locale } from "./i18n-config";

const dictionaries = {
  en: () => import("@/app/dictionaries/en.json").then((m) => m.default),
  fr: () => import("@/app/dictionaries/fr.json").then((m) => m.default),
};

export async function getDictionary(locale: import("./i18n-config").Locale) {
  return dictionaries[locale]();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
