import Link from "next/link";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import { notFound } from "next/navigation";
import LoginForm from "@/app/components/LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="w-full top-0 sticky bg-emerald-950 shadow-xl bg-gradient-to-r from-emerald-900 to-emerald-800 flex items-center justify-between px-6 py-4 z-50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-50 text-2xl">account_balance</span>
          <span className="text-xl font-bold tracking-tighter text-emerald-50">Tabsy</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-3 max-w-lg mx-auto w-full h-1/3 mb-24 overflow-y-scroll">
        <div className="w-full mb-6">
          <h1 className="text-[1.75rem] font-bold leading-tight text-[#191c1d] mb-2">{t.auth.welcomeBack}</h1>
          <p className="text-[#424843] text-base">{t.auth.manageShop}</p>
        </div>

        <LoginForm lang={lang} t={t.auth} />

        <div className="mt-6 mb-6 text-center">
          <p className="text-[#424843] text-sm mb-4">{t.auth.newMerchant}</p>
          <Link href={`/${lang}/register`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#fd761a] text-[#5c2400] font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all w-full">
            <span className="material-symbols-outlined">person_add</span>
            <span>{t.auth.registerShop}</span>
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-4 bg-white/80 backdrop-blur-md rounded-t-[2rem] border-t border-emerald-900/10 shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
        <div className="flex flex-col items-center justify-center bg-orange-100 text-orange-700 rounded-xl px-10 py-3">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest mt-1">{t.auth.login}</span>
        </div>
        <Link href={`/${lang}/register`} className="flex flex-col items-center justify-center text-emerald-800/40 px-10 py-3">
          <span className="material-symbols-outlined">person_add</span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest mt-1">{t.auth.register}</span>
        </Link>
      </footer>
    </div>
  );
}
