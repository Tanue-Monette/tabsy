import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import AmountBanner from "@/app/components/AmountBanner";
import { getSession } from "@/app/lib/session";
import { getMerchant } from "@/app/actions/merchant";
import { getDashboardStats } from "@/app/actions/transactions";
import { getStockItems } from "@/app/actions/stock";
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

  const [merchant, stats, stockItems] = await Promise.all([
    getMerchant(),
    getDashboardStats(session.merchantId),
    getStockItems(),
  ]);

  const firstName = merchant?.merchant_name?.split(" ")[0] ?? "Merchant";
  const lowStockCount = stockItems.filter((i) => i.quantity <= i.low_stock_threshold).length;

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
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href={`/${lang}/new-order`}
            className="bg-[#18181b] text-white rounded-3xl p-5 shadow-lg border border-zinc-800 flex flex-col justify-between hover:bg-[#27272a] transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#a3e635] text-[#121212] flex items-center justify-center mb-3 shadow-md shadow-[#a3e635]/20 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl font-bold">point_of_sale</span>
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white">{t.order.newOrder}</h3>
              <p className="text-zinc-400 text-xs font-medium">{t.dashboard.recordPosSale}</p>
            </div>
          </Link>

          <Link
            href={`/${lang}/stock`}
            className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 flex flex-col justify-between hover:bg-zinc-50 transition-all active:scale-95 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-[#18181b] flex items-center justify-center mb-3 border border-zinc-200 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl">inventory_2</span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-lg text-[#18181b]">{t.dashboard.stockItems}</h3>
                <span className="text-xs font-black text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">{stockItems.length}</span>
              </div>
              <p className="text-zinc-500 text-xs font-medium">{t.dashboard.manageInventory}</p>
            </div>
          </Link>
        </div>

        {/* Low Stock Warning Banner */}
        {lowStockCount > 0 && (
          <Link
            href={`/${lang}/stock`}
            className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-950 hover:bg-amber-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600 text-xl">warning</span>
              <div>
                <p className="font-extrabold text-xs text-amber-900">{lowStockCount} {lowStockCount === 1 ? t.dashboard.itemLowInStock : t.dashboard.itemsLowInStock}</p>
                <p className="text-[10px] text-amber-700 font-medium">{t.dashboard.tapToReplenish}</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-amber-600">chevron_right</span>
          </Link>
        )}

        {/* Sales KPIs Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.dashboard.salesKpis}</h2>
            <span className="text-xs text-zinc-400 font-medium">{t.dashboard.directPosSales}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
                <span className="material-symbols-outlined text-xl">today</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{t.inventoryReport.salesToday}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-black text-[#18181b]">{stats.salesToday.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
                <span className="material-symbols-outlined text-xl">calendar_month</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{t.inventoryReport.thisMonth}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-black text-[#18181b]">{stats.salesMonth.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Debts KPIs Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.dashboard.debtsKpis}</h2>
            <Link href={`/${lang}/customers`} className="text-[#18181b] font-bold text-xs bg-zinc-200/70 hover:bg-zinc-200 px-3 py-1 rounded-xl transition-colors cursor-pointer">
              {t.dashboard.viewAll}
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                <span className="material-symbols-outlined text-xl">schedule</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{t.dashboard.newDebtsToday}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-black text-[#18181b]">{stats.debtsToday.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
                <span className="material-symbols-outlined text-xl">event_repeat</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">{t.dashboard.debtsThisMonth}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-2xl font-black text-[#18181b]">{stats.debtsMonth.toLocaleString()}</h3>
                <span className="text-[10px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>
          </div>

          {/* Hero Total Outstanding Debt Banner */}
          <AmountBanner title={t.dashboard.totalOwed} amount={stats.totalOwed} />
        </section>
      </main>

      <Link href={`/${lang}/new-order`} className="fixed bottom-28 right-6 w-16 h-16 bg-[#a3e635] text-[#121212] shadow-lg shadow-[#a3e635]/30 rounded-2xl flex items-center justify-center z-40 active:scale-95 transition-transform hover:scale-105">
        <span className="material-symbols-outlined text-3xl font-extrabold">point_of_sale</span>
      </Link>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
