import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCustomer, getCustomerTransactions } from "@/app/actions/customers";
import { getDictionary, isValidLocale, type Locale } from "@/app/lib/i18n";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ lang: string; id: string }>;
}) {
  const { lang, id } = await params;
  if (!isValidLocale(lang)) notFound();
  const t = await getDictionary(lang as Locale);

  const [customer, transactions] = await Promise.all([
    getCustomer(id),
    getCustomerTransactions(id),
  ]);

  if (!customer) redirect(`/${lang}/customers`);

  const isOverdue = customer.balance > 0;

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-gradient-to-b from-[#2f4c39] to-[#183524] text-white px-6 pt-12 pb-8 sticky top-0 z-40">
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/${lang}/customers`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{t.customers.customerDetail}</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-all">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#fd761a]/20 flex items-center justify-center border border-white/10">
              <span className="text-2xl font-black text-white">{customer.name[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <p className="text-[#9bbca3]/80 font-medium">{customer.phone ?? t.customers.noPhone}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-4 space-y-6">
        {/* Balance Card */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#c2c8c1]/10">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#424843] font-medium">{t.customers.totalAmountOwed}</p>
            {isOverdue && (
              <span className="bg-[#ffdad6] text-[#93000a] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {t.customers.overdue}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[3.5rem] font-black leading-none text-[#183524]">
              {customer.balance.toLocaleString()}
            </span>
            <span className="text-xl font-bold text-[#424843]/40">FCFA</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-8">
            <Link href={`/${lang}/customers/${id}/add-debt`} className="flex flex-col items-center justify-center gap-2 bg-[#183524] text-white py-4 rounded-xl font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined">add_circle</span>{t.customers.addDebt}
            </Link>
            <Link href={`/${lang}/customers/${id}/record-payment`} className="flex flex-col items-center justify-center gap-2 bg-[#fd761a] text-[#5c2400] py-4 rounded-xl font-bold hover:opacity-90 transition-all">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>{t.customers.recordPayment}
            </Link>
          </div>
        </div>

        {/* Transaction History */}
        <section className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#183524]">{t.customers.transactionHistory}</h3>
          {transactions.length === 0 ? (
            <p className="text-[#424843] text-sm text-center py-8">{t.customers.noTransactions}</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPayment = tx.type === "payment";
                return (
                  <div key={tx.id} className="flex items-center justify-between p-5 bg-[#f3f4f5] rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${isPayment ? "bg-emerald-100 text-emerald-700" : "bg-[#ffdad6] text-[#ba1a1a]"} rounded-full flex items-center justify-center`}>
                        <span className="material-symbols-outlined" style={isPayment ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {isPayment ? "check_circle" : "shopping_basket"}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-[#191c1d]">{tx.description ?? (isPayment ? t.payment.recordPayment : t.debt.recordDebt)}</p>
                        <p className="text-[0.6875rem] text-[#424843]">
                          {new Date(tx.created_at).toLocaleDateString(lang, {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black ${isPayment ? "text-emerald-700" : "text-[#ba1a1a]"}`}>
                        {isPayment ? "+" : "-"}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-[0.6875rem] text-[#424843]/60">FCFA</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 pb-8">
          <div className="bg-[#2f4c39] text-[#9bbca3] p-5 rounded-3xl">
            <span className="material-symbols-outlined mb-2 opacity-60">calendar_month</span>
            <p className="text-[0.6875rem] opacity-60">{t.customers.activeSince}</p>
            <p className="text-xl font-bold text-white">
              {new Date(customer.created_at).toLocaleDateString(lang, { month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="bg-[#edeeef] p-5 rounded-3xl">
            <span className="material-symbols-outlined mb-2 text-[#9d4300]">trending_up</span>
            <p className="text-[0.6875rem] text-[#424843]">{t.customers.status}</p>
            <p className="text-xl font-bold text-[#183524]">{customer.balance <= 0 ? t.customers.cleared : t.customers.active}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
