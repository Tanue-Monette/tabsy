import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import StockList from "@/app/components/StockList";
import AmountBanner from "@/app/components/AmountBanner";
import { getSession } from "@/app/lib/session";
import { getStockItems, getReplenishmentList } from "@/app/actions/stock";
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

  const [items, replenishment] = await Promise.all([
    getStockItems(),
    getReplenishmentList(),
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
              <h1 className="text-xl font-bold text-white leading-tight">{t.stock.title}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6">
        <AmountBanner title="Stock value" amount={stockValue} />

        {replenishment.length > 0 && (
          <Link
            href={`/${lang}/stock/replenish`}
            className="flex items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-600">warning</span>
              <p className="text-amber-900 font-bold text-sm">
                {replenishment.length} item{replenishment.length > 1 ? "s" : ""} need{replenishment.length > 1 ? "" : "s"} restocking
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
