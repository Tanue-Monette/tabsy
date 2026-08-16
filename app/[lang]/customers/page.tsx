import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import CustomerList from "@/app/components/CustomerList";
import AmountBanner from "@/app/components/AmountBanner";
import { getSession } from "@/app/lib/session";
import { getCustomers } from "@/app/actions/customers";
import { getMerchant } from "@/app/actions/merchant";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function CustomersPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const session = await getSession();
  if (!session) redirect(`/${lang}`);

  const [customers, merchant] = await Promise.all([
    getCustomers(),
    getMerchant(),
  ]);

  const firstName = merchant?.merchant_name?.split(" ")[0] ?? "Merchant";
  const totalReceivable = customers.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex justify-between items-center w-full px-6 pt-10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[#a3e635]">storefront</span>
            </div>
            <div>
              <span className="block text-[#a3e635] font-semibold tracking-wider uppercase text-[10px]">
                {t.customers.merchantPanel}
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">
                {t.dashboard.goodMorning}, {firstName}
              </h1>
            </div>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
            <span className="material-symbols-outlined text-lg">notifications</span>
          </button>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6">
        <AmountBanner title={t.customers.totalReceivable} amount={totalReceivable} />
        <CustomerList customers={customers} lang={lang} />
      </main>

      <Link
        href={`/${lang}/add-debt`}
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#a3e635] text-[#121212] rounded-2xl shadow-lg shadow-[#a3e635]/30 flex items-center justify-center active:scale-95 transition-transform hover:scale-105 z-50 font-black"
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          person_add
        </span>
      </Link>

      <BottomNav lang={lang} t={t.nav} />
    </div>
  );
}
