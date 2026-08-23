import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import StockList from "@/app/components/StockList";
import StockValueCards from "@/app/components/StockValueCards";
import { getSession } from "@/app/lib/session";
import { getStockItems, getReplenishmentList, getStockSalesStats, getProfitStats } from "@/app/actions/stock";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function StockPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [items, replenishment, salesStats, profitStats] = await Promise.all([
    getStockItems(),
    getReplenishmentList(),
    getStockSalesStats(),
    getProfitStats(),
  ]);

  // Capital tied up in current inventory — at COST, not sell price. This is
  // what the merchant actually spent, not what they'd get if they sold
  // everything. It falls as stock sells, rises when they restock.
  const stockCapitalValue = items.reduce((sum, i) => sum + i.quantity * i.cost_price, 0);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[#a3e635]">inventory_2</span>
            </div>
            <div>
              <span className="block text-[#a3e635] font-semibold tracking-wider uppercase text-[10px]">
                {t.stock.title}
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">{t.stock.inventoryAndSales}</h1>
            </div>
          </div>
          <Link
            href={`/${lang}/new-order`}
            className="flex items-center gap-1.5 bg-[#a3e635] text-[#121212] font-black text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer hover:bg-[#b4f346]"
          >
            <span className="material-symbols-outlined text-sm font-bold">point_of_sale</span>
            {t.order.newOrder}
          </Link>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6">
        {/* Sales Performance KPIs (Day, Week, Month) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.stock.salesPerformance}</h2>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase">
              {t.stock.livePosRevenue}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-emerald-600 text-lg mb-1">today</span>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.inventoryReport.salesToday}</p>
              </div>
              <div className="mt-2">
                <p className="text-lg font-black text-[#18181b] leading-none">{salesStats.salesToday.toLocaleString()}</p>
                <span className="text-[9px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-emerald-600 text-lg mb-1">date_range</span>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.inventoryReport.thisWeek}</p>
              </div>
              <div className="mt-2">
                <p className="text-lg font-black text-[#18181b] leading-none">{salesStats.salesWeek.toLocaleString()}</p>
                <span className="text-[9px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-200/80 flex flex-col justify-between">
              <div>
                <span className="material-symbols-outlined text-emerald-600 text-lg mb-1">calendar_month</span>
                <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{t.inventoryReport.thisMonth}</p>
              </div>
              <div className="mt-2">
                <p className="text-lg font-black text-[#18181b] leading-none">{salesStats.salesMonth.toLocaleString()}</p>
                <span className="text-[9px] font-bold text-zinc-400">{t.common.fcfa}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown Card for Today's Sales */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-zinc-700 text-lg">account_balance_wallet</span>
                <h3 className="text-xs font-extrabold text-[#18181b] uppercase tracking-wider">
                  {t.stock.todaySalesBreakdown ?? "Today's Revenue Breakdown"}
                </h3>
              </div>
              <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                {salesStats.salesToday.toLocaleString()} FCFA
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Cash Card */}
              <div className="bg-zinc-50 rounded-2xl p-3 border border-zinc-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <span className="material-symbols-outlined text-sm">payments</span>
                  </div>
                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                    {salesStats.salesToday > 0
                      ? Math.round((salesStats.cashToday / salesStats.salesToday) * 100)
                      : 0}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500">{t.stock.cashShort ?? "Cash"}</p>
                  <p className="text-sm font-black text-[#18181b] mt-0.5 leading-tight">
                    {salesStats.cashToday.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-semibold text-zinc-400">FCFA</span>
                </div>
              </div>

              {/* MTN MoMo Card */}
              <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-[10px] shadow-sm">
                    MTN
                  </div>
                  <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200">
                    {salesStats.salesToday > 0
                      ? Math.round((salesStats.mtnToday / salesStats.salesToday) * 100)
                      : 0}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-amber-900">{t.stock.mtnShort ?? "MTN MoMo"}</p>
                  <p className="text-sm font-black text-[#18181b] mt-0.5 leading-tight">
                    {salesStats.mtnToday.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-semibold text-amber-700">FCFA</span>
                </div>
              </div>

              {/* Orange Money Card */}
              <div className="bg-orange-50/60 rounded-2xl p-3 border border-orange-200/60 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-7 h-7 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-black text-[10px] shadow-sm">
                    OM
                  </div>
                  <span className="text-[9px] font-black text-orange-800 bg-orange-100 px-1.5 py-0.5 rounded-full border border-orange-200">
                    {salesStats.salesToday > 0
                      ? Math.round((salesStats.orangeToday / salesStats.salesToday) * 100)
                      : 0}%
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-orange-900">{t.stock.orangeShort ?? "Orange"}</p>
                  <p className="text-sm font-black text-[#18181b] mt-0.5 leading-tight">
                    {salesStats.orangeToday.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-semibold text-orange-700">FCFA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stock Capital (cost basis) vs Profit — kept separate deliberately */}
        <StockValueCards
          capitalLabel={t.stock.totalStockAssetValue}
          capitalValue={stockCapitalValue}
          profitLabel={t.stock.profitThisMonth}
          profitValue={profitStats.profitMonth}
        />

        {/* Low Stock Warning Banner */}
        {replenishment.length > 0 && (
          <Link
            href={`/${lang}/stock/replenish`}
            className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl active:scale-[0.98] transition-all cursor-pointer hover:bg-amber-100/70"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">warning</span>
              <p className="text-amber-900 font-bold text-sm">
                {replenishment.length} {replenishment.length > 1 ? t.stock.itemsNeedRestocking : t.stock.itemNeedsRestocking}
              </p>
            </div>
            <span className="material-symbols-outlined text-amber-600 text-lg">chevron_right</span>
          </Link>
        )}

        <StockList items={items} lang={lang} t={t.stock} />
      </main>

      <Link
        href={`/${lang}/stock/add`}
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#a3e635] text-[#121212] rounded-2xl shadow-lg shadow-[#a3e635]/30 flex items-center justify-center active:scale-95 transition-transform hover:scale-105 z-50 font-black"
      >
        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
          add
        </span>
      </Link>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
