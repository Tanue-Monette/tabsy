import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import { getSession } from "@/app/lib/session";
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

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white flex items-center w-full px-6 pt-10 pb-6 sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <h1 className="text-xl font-bold tracking-tight">{t.nav.transactions}</h1>
      </header>
      <main className="px-6 pt-8">
        <p className="text-[#424843]">Transaction ledger coming soon.</p>
      </main>
      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
