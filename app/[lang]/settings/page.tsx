import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SettingsForm from "@/app/components/SettingsForm";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import { getSession } from "@/app/lib/session";
import { getMerchant, updateSettings } from "@/app/actions/merchant";
import { logout } from "@/app/actions/auth";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const merchant = await getMerchant();
  const settings = merchant?.settings ?? {};

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white flex justify-between items-center w-full px-6 pt-10 pb-6 sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/dashboard`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight">{t.settings.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={lang as Locale} />
          <div className="w-10 h-10 rounded-xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center">
            <span className="material-symbols-outlined text-[#a3e635] text-lg">person</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        {/* Profile Card */}
        <section className="bg-white rounded-3xl p-6 flex items-center gap-5 shadow-sm border border-zinc-200/80">
          <div className="w-16 h-16 rounded-2xl bg-[#18181b] flex items-center justify-center text-[#a3e635] shrink-0 border border-zinc-800">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-[#18181b] tracking-tight">{merchant?.shop_name ?? "Your Shop"}</h2>
            <p className="text-zinc-500 font-medium text-xs mt-0.5">+237 {merchant?.phone}</p>
            <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#a3e635]/20 text-[#365314] uppercase tracking-wider">
              {t.settings.verifiedMerchant}
            </span>
          </div>
        </section>

        <SettingsForm settings={settings} t={t} />

        {/* Sign Out */}
        <div className="pt-2">
          <form action={logout}>
            <button type="submit" className="w-full flex items-center justify-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl font-bold hover:bg-rose-100 transition-colors border border-rose-100">
              <span className="material-symbols-outlined">logout</span>{t.auth.logout}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-400 mt-6 uppercase tracking-widest font-bold">
            {t.settings.appVersion}
          </p>
        </div>
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
