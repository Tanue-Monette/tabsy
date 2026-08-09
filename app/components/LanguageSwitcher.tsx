"use client";

import { useRouter, usePathname } from "next/navigation";
import { locales, type Locale } from "@/app/lib/i18n-config";

const labels: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(locale: Locale) {
    // Replace the current locale prefix in the path
    const segments = pathname.split("/");
    segments[1] = locale; // segments[0] is "", segments[1] is the locale
    const newPath = segments.join("/");

    // Set cookie so middleware remembers the preference
    document.cookie = `tabsy_locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-1 bg-white/10 rounded-lg p-1">
      {locales.map((locale) => (
        <button
          key={locale}
          onPointerDown={() => switchLocale(locale)}
          className={`px-2.5 py-1 rounded text-xs font-bold transition-colors ${
            currentLocale === locale
              ? "bg-white text-[#183524]"
              : "text-white/70 hover:text-white"
          }`}
        >
          {labels[locale]}
        </button>
      ))}
    </div>
  );
}
