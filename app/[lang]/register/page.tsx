import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import RegisterForm from "@/app/components/RegisterForm";

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
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

      <main className="flex-grow flex flex-col items-center px-6 pt-12 pb-24 max-w-md mx-auto w-full">
        <div className="w-full mb-10 space-y-2">
          <h1 className="text-[1.75rem] font-bold leading-tight text-[#183524]">{t.auth.registerTitle}</h1>
          <p className="text-[#424843] opacity-80">{t.auth.registerSubtitle}</p>
        </div>
        <RegisterForm lang={lang} t={t.auth} />
        <div className="mt-12 p-6 rounded-xl bg-[#f3f4f5] w-full flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#ffdbca] flex items-center justify-center">
            <span className="material-symbols-outlined text-[#341100]">verified_user</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#424843]">{t.auth.merchantSecurity}</p>
            <p className="text-sm text-[#191c1d]">{t.auth.merchantSecurityDesc}</p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.04)] rounded-t-[2rem] border-t border-emerald-900/10">
        <Link href={`/${lang}`} className="flex flex-col items-center justify-center text-emerald-800/40 px-6 py-2">
          <span className="material-symbols-outlined">login</span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest">{t.auth.login}</span>
        </Link>
        <div className="flex flex-col items-center justify-center bg-orange-100 text-orange-700 rounded-xl px-6 py-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          <span className="text-[0.6875rem] font-semibold uppercase tracking-widest">{t.auth.register}</span>
        </div>
      </nav>
    </div>
  );
}
