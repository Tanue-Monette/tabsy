import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function ForgotPinPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  return (
    <div className="flex flex-col min-h-screen text-[#191c1d]">
      <header className="flex items-center w-full px-6 py-10 bg-emerald-950">
        <Link href={`/${lang}`} className="flex items-center justify-center transition-opacity duration-200 active:opacity-80 hover:bg-emerald-900/50 p-2 rounded-full">
          <span className="material-symbols-outlined text-emerald-50">arrow_back</span>
        </Link>
        <span className="ml-4 text-emerald-50 font-bold text-xl tracking-tight">Tabsy</span>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        <div className="w-full mb-12 text-center">
          <div className="mb-6 inline-flex items-center justify-center w-16 h-16 bg-[#2f4c39] rounded-2xl">
            <span className="material-symbols-outlined text-[#c9ebd1] text-3xl">lock_reset</span>
          </div>
          <h1 className="text-[1.75rem] font-extrabold text-[#183524] mb-3">{t.auth.forgotPinTitle}</h1>
          <p className="text-[#424843] leading-relaxed px-4">{t.auth.forgotPinDesc}</p>
        </div>

        <div className="w-full space-y-8">
          <div className="space-y-2">
            <label className="block font-medium text-[#424843] ml-1 uppercase tracking-wider text-[0.6875rem]" htmlFor="phone-number">
              {t.auth.phoneNumber}
            </label>
            <div className="flex items-center bg-[#e1e3e4] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#183524]/20 transition-all">
              <div className="flex items-center px-4 py-4 border-r border-[#c2c8c1]/30 text-[#191c1d] font-semibold">
                <span className="text-[#424843] mr-2 text-sm">🇨🇲</span>
                <span>+237</span>
              </div>
              <input className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 text-[#191c1d] font-medium placeholder:text-[#424843]/40" id="phone-number" placeholder="6XX XXX XXX" type="tel" />
            </div>
          </div>

          <Link href={`/${lang}/reset-pin`} className="w-full py-5 bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#183524]/10 transition-transform active:scale-95 flex items-center justify-center">
            {t.auth.sendResetCode}
          </Link>

          <div className="text-center">
            <Link href={`/${lang}`} className="font-semibold text-[#183524] py-2 px-6 hover:bg-[#183524]/5 rounded-full transition-colors">{t.auth.backToLogin}</Link>
          </div>
        </div>

        <div className="mt-auto pt-16 text-center">
          <div className="inline-flex items-center space-x-2 text-[#424843]/60">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            <span className="text-[0.6875rem] font-medium">{t.auth.encryptedConnection}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
