import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AddStockItemForm from "@/app/components/AddStockItemForm";
import { getSession } from "@/app/lib/session";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function AddStockItemPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <header className="flex items-center w-full px-6 pt-10 pb-6 bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <Link
          href={`/${lang}/stock`}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Link>
        <h1 className="ml-4 text-xl font-bold tracking-tight">{t.stock.addItem}</h1>
      </header>

      <AddStockItemForm t={t.stock} />
    </div>
  );
}
