import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import AmountBanner from "@/app/components/AmountBanner";
import { getSession } from "@/app/lib/session";
import { getMerchant } from "@/app/actions/merchant";
import { getDashboardStats } from "@/app/actions/transactions";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [merchant, stats] = await Promise.all([
    getMerchant(),
    getDashboardStats(session.merchantId),
  ]);

  const firstName = merchant?.merchant_name?.split(" ")[0] ?? "Merchant";

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[#a3e635]">storefront</span>
            </div>
            <div>
              <span className="block text-[#a3e635] font-semibold tracking-wider uppercase text-[10px]">
                {merchant?.shop_name ?? "Tabsy"}
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">
                {t.dashboard.goodMorning}, {firstName}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={lang as Locale} />
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
              <span className="material-symbols-outlined text-lg">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6 relative z-10">
        {/* Unified Hero Balance Banner */}
        <AmountBanner title={t.dashboard.totalOwed} amount={stats.totalOwed} />

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[#18181b] text-2xl">group</span>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight mb-1">{t.dashboard.totalCustomers}</p>
            <h3 className="text-3xl font-black text-[#18181b]">{stats.topDebtors.length}</h3>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#a3e635]/20 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[#365314] text-2xl">payments</span>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight mb-1">{t.dashboard.paymentsToday}</p>
            <h3 className="text-3xl font-black text-[#18181b]">{stats.paymentsToday.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-zinc-400">FCFA</span>
          </div>
        </div>

        {/* Monthly Report */}
        <section>
          <div className="bg-zinc-100/90 rounded-3xl p-6 shadow-sm border border-zinc-200/60">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.dashboard.monthlyReport}</h2>
                <p className="text-xs text-zinc-400 font-medium">
                  {new Date().toLocaleString(lang, { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.dashboard.totalCollected}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#18181b]">{stats.monthlyCollected.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-zinc-400">FCFA</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{t.dashboard.newDebts}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-amber-600">{stats.monthlyDebts.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-zinc-400">FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Debtors */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-extrabold text-[#18181b]">{t.dashboard.topDebtors}</h2>
            <Link href={`/${lang}/customers`} className="text-[#18181b] font-bold text-xs bg-zinc-200/70 hover:bg-zinc-200 px-3 py-1.5 rounded-xl transition-colors">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80">
            {stats.topDebtors.length === 0 ? (
              <p className="p-6 text-zinc-500 text-sm text-center">{t.dashboard.noCustomers}</p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {stats.topDebtors.map((c) => (
                  <Link key={c.id} href={`/${lang}/customers/${c.id}`} className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-colors block">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center font-black text-lg text-[#18181b]">
                        {c.name[0].toUpperCase()}
                      </div>
                      <h4 className="font-extrabold text-[#18181b] text-base">{c.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-rose-600">{c.balance.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-rose-600/70 uppercase">FCFA</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Link href={`/${lang}/add-debt`} className="fixed bottom-28 right-6 w-16 h-16 bg-[#a3e635] text-[#121212] shadow-lg shadow-[#a3e635]/30 rounded-2xl flex items-center justify-center z-40 active:scale-95 transition-transform hover:scale-105">
        <span className="material-symbols-outlined text-3xl font-extrabold">add</span>
      </Link>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
