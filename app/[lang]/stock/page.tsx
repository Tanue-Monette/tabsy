import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import StockList from "@/app/components/StockList";
import AmountBanner from "@/app/components/AmountBanner";
import { getSession } from "@/app/lib/session";
import { getStockItems, getReplenishmentList, getStockSalesStats } from "@/app/actions/stock";
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

  const [items, replenishment, salesStats] = await Promise.all([
    getStockItems(),
    getReplenishmentList(),
    getStockSalesStats(),
  ]);

  const stockValue = items.reduce((sum, i) => sum + i.quantity * i.sell_price, 0);

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
        </section>

        {/* Total Stock Value */}
        <AmountBanner title={t.stock.totalStockAssetValue} amount={stockValue} />

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
