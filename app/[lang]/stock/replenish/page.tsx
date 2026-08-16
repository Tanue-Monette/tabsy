import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getReplenishmentList } from "@/app/actions/stock";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function ReplenishPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const items = await getReplenishmentList();

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col pb-12">
      <header className="flex items-center w-full px-6 pt-10 pb-6 bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <Link
          href={`/${lang}/stock`}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <h1 className="ml-4 text-xl font-bold tracking-tight">{t.stock.replenishmentList}</h1>
      </header>

      <main className="flex-grow px-6 pt-6 space-y-3">
        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200/80">
            <span className="material-symbols-outlined text-4xl text-emerald-400 mb-3 block">check_circle</span>
            <p className="text-zinc-600 font-semibold">{t.stock.replenishmentEmpty}</p>
          </div>
        ) : (
          items.map((item) => {
            const isOut = item.quantity <= 0;
            return (
              <Link
                key={item.id}
                href={`/${lang}/stock/${item.id}/restock`}
                className="bg-white p-4 rounded-3xl flex items-center justify-between border border-zinc-200/80 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isOut ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    <span className="material-symbols-outlined">{isOut ? "remove_shopping_cart" : "warning"}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#18181b] text-base truncate">{item.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium">
                      {t.stock.currentQuantity}: {item.quantity.toLocaleString()} {item.unit} · {t.stock.threshold}: {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">chevron_right</span>
              </Link>
            );
          })
        )}
      </main>
    </div>
  );
}
