import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
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
      <header className="bg-[#183524]">
        <div className="flex justify-between items-center w-full px-6 pt-12 pb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#2f4c39] border-2 border-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#9bbca3]">storefront</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {t.dashboard.goodMorning}, {firstName}
              </h1>
              <p className="text-white/50 text-xs">{merchant?.shop_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher currentLocale={lang as Locale} />
            <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-6 relative z-10">
        {/* Hero Balance */}
        <section className="bg-[#2f4c39] rounded-2xl p-8 mb-6 shadow-2xl ring-1 ring-white/10">
          <span className="text-[#9bbca3]/60 font-bold tracking-widest uppercase text-[10px] mb-2 block">
            {t.dashboard.totalOwed}
          </span>
          <div className="flex items-baseline">
            <span className="text-[3.5rem] font-black leading-none text-white">
              {stats.totalOwed.toLocaleString()}
            </span>
            <span className="text-[#aeceb5] text-xl font-black ml-2">FCFA</span>
          </div>
        </section>

        {/* Summary Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-[#c2c8c1]/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#183524] text-3xl">group</span>
            </div>
            <p className="text-[#424843] text-xs font-bold uppercase tracking-tight">{t.dashboard.totalCustomers}</p>
            <h3 className="text-3xl font-black text-[#191c1d]">{stats.topDebtors.length}</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-[#c2c8c1]/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[#9d4300] text-3xl">payments</span>
            </div>
            <p className="text-[#424843] text-xs font-bold uppercase tracking-tight">{t.dashboard.paymentsToday}</p>
            <h3 className="text-3xl font-black text-[#191c1d]">{stats.paymentsToday.toLocaleString()}</h3>
            <span className="text-[10px] font-bold text-[#424843]">FCFA</span>
          </div>
        </div>

        {/* Monthly Report */}
        <section className="mb-8">
          <div className="bg-[#edeeef] rounded-2xl p-6 shadow-sm ring-1 ring-[#c2c8c1]/10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#424843] uppercase tracking-wider">{t.dashboard.monthlyReport}</h2>
                <p className="text-xs text-[#424843]/70 font-medium">
                  {new Date().toLocaleString(lang, { month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#424843] uppercase opacity-70">{t.dashboard.totalCollected}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#183524]">{stats.monthlyCollected.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-[#424843]">FCFA</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#424843] uppercase opacity-70">{t.dashboard.newDebts}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-[#9d4300]">{stats.monthlyDebts.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-[#424843]">FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Top Debtors */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-[#191c1d]">{t.dashboard.topDebtors}</h2>
            <Link href={`/${lang}/customers`} className="text-[#183524] font-bold text-sm bg-[#183524]/5 px-3 py-1 rounded-lg">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm ring-1 ring-[#c2c8c1]/20">
            {stats.topDebtors.length === 0 ? (
              <p className="p-6 text-[#424843] text-sm text-center">{t.dashboard.noCustomers}</p>
            ) : (
              <div className="divide-y divide-[#c2c8c1]/10">
                {stats.topDebtors.map((c) => (
                  <Link key={c.id} href={`/${lang}/customers/${c.id}`} className="flex items-center justify-between p-5 hover:bg-[#f3f4f5] transition-colors block">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-[#e7e8e9] flex items-center justify-center font-bold text-xl text-[#183524]">
                        {c.name[0].toUpperCase()}
                      </div>
                      <h4 className="font-extrabold text-[#191c1d] text-lg">{c.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#ba1a1a]">{c.balance.toLocaleString()}</p>
                      <span className="text-[10px] font-bold text-[#ba1a1a]/60 uppercase">FCFA</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Link href={`/${lang}/add-debt`} className="fixed bottom-28 right-6 w-16 h-16 bg-[#9d4300] text-white shadow-[0_12px_24px_rgba(253,118,26,0.3)] rounded-2xl flex items-center justify-center z-40 active:scale-90 transition-transform">
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </Link>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
