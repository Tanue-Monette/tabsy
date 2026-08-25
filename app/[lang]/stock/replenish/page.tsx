import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/app/lib/session";
import { getReplenishmentList } from "@/app/actions/stock";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";
import ReplenishListClient from "@/app/components/ReplenishListClient";

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
      <header className="flex items-center justify-between w-full px-6 pt-10 pb-6 bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex items-center">
          <Link
            href={`/${lang}/stock`}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <h1 className="ml-4 text-xl font-bold tracking-tight">{t.stock.replenishmentList}</h1>
        </div>
        <Link
          href={`/${lang}/stock/history`}
          className="flex items-center gap-1.5 bg-zinc-800/80 hover:bg-zinc-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl active:scale-95 transition-all border border-zinc-700/40"
        >
          <span className="material-symbols-outlined text-sm text-[#a3e635]">history</span>
          {t.stock.history ?? "History"}
        </Link>
      </header>

      <main className="flex-grow px-6 pt-6">
        <ReplenishListClient items={items} lang={lang} t={t.stock} />
      </main>
    </div>
  );
}
