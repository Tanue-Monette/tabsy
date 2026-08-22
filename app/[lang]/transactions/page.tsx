import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import InventorySalesReportClient from "@/app/components/InventorySalesReportClient";
import { getSession } from "@/app/lib/session";
import { getMerchant } from "@/app/actions/merchant";
import { getItemsSoldReport, getPaymentStatsReport } from "@/app/actions/orders";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function TransactionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [items, paymentStats, merchant] = await Promise.all([
    getItemsSoldReport(),
    getPaymentStatsReport(),
    getMerchant(),
  ]);

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[#a3e635]">query_stats</span>
            </div>
            <div>
              <span className="block text-[#a3e635] font-semibold tracking-wider uppercase text-[10px]">
                {merchant?.shop_name ?? "Tabsy"} POS
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">{t.inventoryReport.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${lang}/orders`}
              className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all border border-zinc-700/40"
            >
              <span className="material-symbols-outlined text-sm">list_alt</span>
              {t.orders.title}
            </Link>
            <Link
              href={`/${lang}/new-order`}
              className="flex items-center gap-1.5 bg-[#a3e635] text-[#121212] font-black text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-[#a3e635]/20 cursor-pointer hover:bg-[#b4f346]"
            >
              <span className="material-symbols-outlined text-sm font-bold">point_of_sale</span>
              {t.order.newOrder}
            </Link>
          </div>
        </div>
      </header>

      <main className="px-6 pt-6">
        <InventorySalesReportClient
          items={items}
          paymentStats={paymentStats}
          merchantName={merchant?.merchant_name}
          shopName={merchant?.shop_name}
          t={t.inventoryReport}
        />
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
