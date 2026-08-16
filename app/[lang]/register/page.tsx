import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import RegisterForm from "@/app/components/RegisterForm";

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  return (
    <div className="bg-[#f8f9fa] text-[#18181b] min-h-screen flex flex-col">
      <header className="w-full top-0 sticky bg-[#18181b] shadow-lg flex items-center justify-between px-6 py-4 z-50 border-b border-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#a3e635] text-2xl">account_balance</span>
          <span className="text-xl font-black tracking-tighter text-white">Tabsy</span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center px-6 pt-10 pb-24 max-w-md mx-auto w-full">
        <div className="w-full mb-8 space-y-1">
          <h1 className="text-2xl font-black leading-tight text-[#18181b]">{t.auth.registerTitle}</h1>
          <p className="text-zinc-500 text-sm font-medium">{t.auth.registerSubtitle}</p>
        </div>
        <RegisterForm lang={lang} t={t.auth} />
        <div className="mt-8 p-5 rounded-3xl bg-zinc-100 border border-zinc-200/80 w-full flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#18181b] flex items-center justify-center text-[#a3e635] shrink-0 border border-zinc-800">
            <span className="material-symbols-outlined">verified_user</span>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">{t.auth.merchantSecurity}</p>
            <p className="text-xs text-[#18181b] font-medium leading-relaxed">{t.auth.merchantSecurityDesc}</p>
          </div>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-3xl border-t border-zinc-200/80">
        <Link href={`/${lang}`} className="flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-600 px-6 py-2">
          <span className="material-symbols-outlined text-xl">login</span>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">{t.auth.login}</span>
        </Link>
        <div className="flex flex-col items-center justify-center bg-[#18181b] text-[#a3e635] rounded-2xl px-6 py-2 shadow-md shadow-[#18181b]/10">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>
          <span className="text-[10px] font-extrabold tracking-tight mt-0.5">{t.auth.register}</span>
        </div>
      </nav>
    </div>
  );
}
