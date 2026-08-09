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
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="bg-emerald-950 flex items-center w-full px-6 py-10 bg-gradient-to-b from-emerald-900 to-emerald-950">
        <Link href={`/${lang}/forgot-pin`} className="mr-4 text-emerald-50 hover:bg-emerald-900/50 p-2 rounded-full transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-emerald-50 text-xl font-bold">{t.auth.resetPin}</h1>
      </header>

      <main className="flex-grow flex flex-col px-6 pt-16 pb-12 max-w-lg mx-auto w-full">
        <div className="mb-12">
          <h2 className="text-[1.75rem] font-extrabold leading-tight text-[#183524] mb-4">{t.auth.createNewPin}</h2>
          <p className="text-[#424843] leading-relaxed opacity-80">{t.auth.createNewPinDesc}</p>
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <label className="block text-sm font-semibold tracking-wide text-[#424843] uppercase ml-1">{t.auth.newPin}</label>
            <div className="flex gap-4 justify-between items-center">
              {["•", "•", "", ""].map((val, i) => (
                <input key={i} className="w-16 h-20 text-center text-3xl font-bold bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 transition-all" maxLength={1} readOnly type="password" defaultValue={val} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-semibold tracking-wide text-[#424843] uppercase ml-1">{t.auth.confirmPin}</label>
            <div className="flex gap-4 justify-between items-center">
              {[0, 1, 2, 3].map((i) => (
                <input key={i} className="w-16 h-20 text-center text-3xl font-bold bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 transition-all" maxLength={1} readOnly type="password" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-6">
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} className="h-16 flex items-center justify-center text-xl font-bold rounded-xl bg-[#f3f4f5] hover:bg-[#e7e8e9] active:scale-95 transition-all text-[#191c1d]">{n}</button>
            ))}
            <div className="h-16"></div>
            <button className="h-16 flex items-center justify-center text-xl font-bold rounded-xl bg-[#f3f4f5] hover:bg-[#e7e8e9] active:scale-95 transition-all text-[#191c1d]">0</button>
            <button className="h-16 flex items-center justify-center rounded-xl bg-[#f3f4f5] hover:bg-[#e7e8e9] active:scale-95 transition-all text-[#191c1d]">
              <span className="material-symbols-outlined">backspace</span>
            </button>
          </div>
        </div>

        <div className="mt-auto pt-12 text-center space-y-6">
          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ffdadc] rounded-full mx-auto w-fit">
            <span className="material-symbols-outlined text-sm text-[#301216]">verified_user</span>
            <span className="text-[0.6875rem] font-medium text-[#301216]">{t.auth.neverSharePin}</span>
          </div>
          <Link href={`/${lang}/dashboard`} className="w-full bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white py-5 rounded-xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center">
            {t.auth.resetPin}
          </Link>
        </div>
      </main>
    </div>
  );
}
