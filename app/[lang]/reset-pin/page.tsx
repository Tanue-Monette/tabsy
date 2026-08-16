import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function ResetPinPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  return (
    <div className="bg-[#f8f9fa] text-[#18181b] min-h-screen flex flex-col">
      <header className="bg-[#18181b] text-white flex items-center w-full px-6 py-4 shadow-lg border-b border-zinc-800/50">
        <Link href={`/${lang}/forgot-pin`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <h1 className="text-white text-xl font-bold ml-4">{t.auth.resetPin}</h1>
      </header>

      <main className="flex-grow flex flex-col px-6 pt-10 pb-12 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-black leading-tight text-[#18181b] mb-2">{t.auth.createNewPin}</h2>
          <p className="text-zinc-500 text-sm font-medium">{t.auth.createNewPinDesc}</p>
        </div>

        <div className="space-y-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase ml-1">{t.auth.newPin}</label>
            <div className="flex gap-3 justify-between items-center">
              {["•", "•", "", ""].map((val, i) => (
                <input key={i} className="w-14 h-16 text-center text-2xl font-black bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] transition-all text-[#18181b]" maxLength={1} readOnly type="password" defaultValue={val} />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-bold tracking-widest text-zinc-400 uppercase ml-1">{t.auth.confirmPin}</label>
            <div className="flex gap-3 justify-between items-center">
              {[0, 1, 2, 3].map((i) => (
                <input key={i} className="w-14 h-16 text-center text-2xl font-black bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] transition-all text-[#18181b]" maxLength={1} readOnly type="password" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-4">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} className="h-14 flex items-center justify-center text-xl font-bold rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all text-[#18181b]">{n}</button>
            ))}
            <div className="h-14"></div>
            <button className="h-14 flex items-center justify-center text-xl font-bold rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all text-[#18181b]">0</button>
            <button className="h-14 flex items-center justify-center rounded-2xl bg-zinc-100 hover:bg-zinc-200 active:scale-95 transition-all text-[#18181b]">
              <span className="material-symbols-outlined">backspace</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-10 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#a3e635]/20 border border-[#a3e635]/50 rounded-full mx-auto w-fit">
            <span className="material-symbols-outlined text-sm text-[#365314]">verified_user</span>
            <span className="text-[10px] font-extrabold text-[#365314] uppercase tracking-wider">{t.auth.neverSharePin}</span>
          </div>
          <Link href={`/${lang}/dashboard`} className="w-full bg-[#18181b] hover:bg-[#27272a] text-white py-4 rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span>{t.auth.resetPin}</span>
            <span className="material-symbols-outlined text-[#a3e635]">arrow_forward</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
