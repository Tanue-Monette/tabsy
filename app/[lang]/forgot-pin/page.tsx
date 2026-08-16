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
    <div className="flex flex-col min-h-screen text-[#18181b] bg-[#f8f9fa]">
      <header className="flex items-center w-full px-6 py-4 bg-[#18181b] shadow-lg border-b border-zinc-800/50">
        <Link href={`/${lang}`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <span className="ml-4 text-white font-black text-xl tracking-tighter">Tabsy</span>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12 max-w-md mx-auto w-full">
        <div className="w-full mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 bg-[#18181b] border border-zinc-800 rounded-2xl">
            <span className="material-symbols-outlined text-[#a3e635] text-3xl">lock_reset</span>
          </div>
          <h1 className="text-2xl font-black text-[#18181b] mb-2">{t.auth.forgotPinTitle}</h1>
          <p className="text-zinc-500 text-sm leading-relaxed px-2 font-medium">{t.auth.forgotPinDesc}</p>
        </div>

        <div className="w-full space-y-6">
          <div className="space-y-2">
            <label className="block font-bold text-zinc-400 uppercase tracking-widest text-[10px] ml-1" htmlFor="phone-number">
              {t.auth.phoneNumber}
            </label>
            <div className="flex items-center bg-zinc-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#18181b] transition-all">
              <div className="flex items-center px-4 py-4 border-r border-zinc-200 text-[#18181b] font-bold text-sm">
                <span className="text-zinc-500 mr-2 text-sm">🇨🇲</span>
                <span>+237</span>
              </div>
              <input className="w-full bg-transparent border-none focus:ring-0 py-4 px-4 text-[#18181b] font-medium placeholder:text-zinc-400" id="phone-number" placeholder="6XX XXX XXX" type="tel" />
            </div>
          </div>

          <Link href={`/${lang}/reset-pin`} className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white font-extrabold text-base rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span>{t.auth.sendResetCode}</span>
            <span className="material-symbols-outlined text-[#a3e635] text-xl">arrow_forward</span>
          </Link>

          <div className="text-center">
            <Link href={`/${lang}`} className="font-extrabold text-[#18181b] py-2 px-6 hover:bg-zinc-200/50 rounded-full transition-colors text-xs">{t.auth.backToLogin}</Link>
          </div>
        </div>

        <div className="mt-auto pt-12 text-center">
          <div className="inline-flex items-center space-x-2 text-zinc-400">
            <span className="material-symbols-outlined text-sm text-[#18181b]">verified_user</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{t.auth.encryptedConnection}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
