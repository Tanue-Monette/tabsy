import Link from "next/link";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import { notFound } from "next/navigation";
import LoginForm from "@/app/components/LoginForm";

export default async function LoginPage({ params }: { params: Promise<{ lang: string }> }) {
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-6 max-w-lg mx-auto w-full mb-24">
        <div className="w-full mb-6">
          <h1 className="text-2xl font-black leading-tight text-[#18181b] mb-1.5">{t.auth.welcomeBack}</h1>
          <p className="text-zinc-500 text-sm font-medium">{t.auth.manageShop}</p>
        </div>

        <LoginForm lang={lang} t={t.auth} />

        <div className="mt-8 text-center w-full">
          <p className="text-zinc-500 text-xs font-semibold mb-3">{t.auth.newMerchant}</p>
          <Link href={`/${lang}/register`} className="inline-flex items-center justify-center gap-2 px-6 py-4 bg-zinc-100 border border-zinc-200 text-[#18181b] font-extrabold rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all w-full text-sm">
            <span className="material-symbols-outlined text-[#18181b]">person_add</span>
            <span>{t.auth.registerShop}</span>
          </Link>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-md rounded-t-3xl border-t border-zinc-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col items-center justify-center bg-[#18181b] text-[#a3e635] rounded-2xl px-10 py-2 shadow-md shadow-[#18181b]/10">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
          <span className="text-[10px] font-extrabold tracking-tight mt-0.5">{t.auth.login}</span>
        </div>
        <Link href={`/${lang}/register`} className="flex flex-col items-center justify-center text-zinc-400 hover:text-zinc-600 px-10 py-2">
          <span className="material-symbols-outlined text-xl">person_add</span>
          <span className="text-[10px] font-bold tracking-tight mt-0.5">{t.auth.register}</span>
        </Link>
      </footer>
    </div>
  );
}
