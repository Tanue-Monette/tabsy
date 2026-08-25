import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import StockHistoryClient from "@/app/components/StockHistoryClient";
import { getSession } from "@/app/lib/session";
import { getMerchant } from "@/app/actions/merchant";
import { getStockMovements } from "@/app/actions/stock";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function StockHistoryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [movements, merchant] = await Promise.all([
    getStockMovements(),
    getMerchant(),
  ]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/stock`}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <div>
              <span className="block text-[#a3e635] font-semibold tracking-wider uppercase text-[10px]">
                {merchant?.shop_name ?? "Tabsy"} POS
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">
                {t.stockHistory?.title ?? "Restock & Movement Report"}
              </h1>
            </div>
          </div>
          <Link
            href={`/${lang}/stock/replenish`}
            className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all border border-zinc-700/40"
          >
            <span className="material-symbols-outlined text-sm text-amber-400">warning</span>
            {t.stock.replenishmentList}
          </Link>
        </div>
      </header>

      <main className="px-6 pt-6">
        <StockHistoryClient
          movements={movements}
          merchantName={merchant?.merchant_name}
          shopName={merchant?.shop_name}
          t={t.stockHistory}
        />
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
