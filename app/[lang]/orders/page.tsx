import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import OrdersListClient from "@/app/components/OrdersListClient";
import { getSession } from "@/app/lib/session";
import { getOrders } from "@/app/actions/orders";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function OrdersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const orders = await getOrders();

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}/transactions`}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
            <h1 className="ml-1 text-xl font-bold text-white leading-tight">{t.orders.title}</h1>
          </div>
          <Link
            href={`/${lang}/new-order`}
            className="flex items-center gap-1.5 bg-[#a3e635] text-[#121212] font-black text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all shadow-md shadow-[#a3e635]/20 hover:bg-[#b4f346]"
          >
            <span className="material-symbols-outlined text-sm font-bold">point_of_sale</span>
            {t.order.newOrder}
          </Link>
        </div>
      </header>

      <main className="px-6 pt-6">
        <OrdersListClient orders={orders} lang={lang} t={t.orders} />
      </main>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
