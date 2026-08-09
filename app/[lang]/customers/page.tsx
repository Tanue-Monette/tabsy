import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BottomNav from "@/app/components/BottomNav";
import CustomerList from "@/app/components/CustomerList";
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
      <header className="bg-gradient-to-b from-emerald-900 to-emerald-950 flex justify-between items-center w-full px-6 pt-12 pb-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-800 flex items-center justify-center border-2 border-emerald-50/20">
            <span className="material-symbols-outlined text-emerald-200">storefront</span>
          </div>
          <div>
            <span className="block text-emerald-200/60 font-medium tracking-wider uppercase text-[0.6875rem]">
              {t.customers.merchantPanel}
            </span>
            <h1 className="text-emerald-50 font-bold leading-tight text-[1.75rem]">
              {t.dashboard.goodMorning}, {firstName}
            </h1>
          </div>
        </div>
        <button className="h-12 w-12 rounded-xl bg-emerald-900/50 flex items-center justify-center text-emerald-50 hover:bg-emerald-800 transition-all">
          <span className="material-symbols-outlined">notifications</span>
        </button>
      </header>

      <main className="px-6 space-y-6 mt-8">
        <div className="bg-gradient-to-br from-[#183524] to-[#2f4c39] p-6 rounded-3xl text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-3xl" />
          <div className="relative z-10">
            <p className="text-white/60 font-medium text-sm">{t.customers.totalReceivable}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-black">{totalReceivable.toLocaleString()}</span>
              <span className="text-lg font-medium opacity-40">FCFA</span>
            </div>
          </div>
        </div>

        <CustomerList customers={customers} lang={lang} />
      </main>

      <Link
        href={`/${lang}/add-debt`}
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#fd761a] text-[#5c2400] rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all z-50"
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
