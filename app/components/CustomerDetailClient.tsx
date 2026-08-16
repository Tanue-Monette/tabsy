"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db, type CachedTransaction } from "@/app/lib/db";
import { cacheOnlineTransactions, subscribeSyncStatus } from "@/app/lib/syncEngine";
import type { Dictionary } from "@/app/lib/i18n";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  created_at: string;
};

type Transaction = {
  id: string;
  customer_id: string;
  type: "debt" | "payment";
  amount: number;
  description?: string | null;
  method?: string | null;
  created_at: string;
  isPending?: boolean;
};

type Props = {
  customer: Customer;
  transactions: Omit<Transaction, "customer_id">[];
  lang: string;
  t: Dictionary["customers"];
  debtDict: Dictionary["debt"];
  paymentDict: Dictionary["payment"];
  orderDict: Dictionary["order"];
};

export default function CustomerDetailClient({
  customer: serverCustomer,
  transactions: rawTransactions,
  lang,
  t,
  debtDict,
  paymentDict,
  orderDict,
}: Props) {
  const serverTransactions: Transaction[] = rawTransactions.map((tx) => ({
    ...tx,
    customer_id: serverCustomer.id,
  }));

  const [customer, setCustomer] = useState(serverCustomer);
  const [transactions, setTransactions] = useState<Transaction[]>(serverTransactions);

  useEffect(() => {
    cacheOnlineTransactions(serverTransactions);

    const loadLocalData = async () => {
      try {
        const localCust = await db.cachedCustomers.get(serverCustomer.id);
        if (localCust) {
          setCustomer((prev) => ({
            ...prev,
            balance: localCust.balance,
          }));
        }

        const localTxs = await db.cachedTransactions
          .where("customer_id")
          .equals(serverCustomer.id)
          .reverse()
          .toArray();

        if (localTxs.length > 0) {
          setTransactions(
            localTxs.map((tx) => ({ ...tx, description: tx.description ?? null, method: tx.method ?? null }))
          );
        }
      } catch (err) {
        console.error("Dexie read error in customer detail:", err);
      }
    };

    loadLocalData();
    const unsubscribe = subscribeSyncStatus(loadLocalData);
    return () => unsubscribe();
  }, [serverCustomer, serverTransactions]);

  const isOverdue = customer.balance > 0;

  return (
    <div className="bg-[#f8f9fa] min-h-screen pb-32">
      <header className="bg-[#18181b] text-white px-6 pt-10 pb-6 sticky top-0 z-40 shadow-lg border-b border-zinc-800/50">
        <div className="flex items-center gap-4 mb-4">
          <Link href={`/${lang}/customers`} className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </Link>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">{t.customerDetail}</h1>
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-zinc-800/80 hover:bg-zinc-800 text-white transition-colors border border-zinc-700/40">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#27272a] border border-zinc-700/50 flex items-center justify-center">
              <span className="text-2xl font-black text-[#a3e635]">{customer.name[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">{customer.name}</h2>
              <p className="text-zinc-400 font-medium text-xs">{customer.phone ?? t.noPhone}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6">
        {/* Balance Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80">
          <div className="flex items-center justify-between mb-2">
            <p className="text-zinc-500 font-semibold text-xs uppercase tracking-wider">{t.totalAmountOwed}</p>
            {isOverdue && (
              <span className="bg-rose-50 text-rose-600 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-rose-100">
                {t.overdue}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black leading-none text-[#18181b]">
              {customer.balance.toLocaleString()}
            </span>
            <span className="text-lg font-bold text-zinc-400">FCFA</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Link href={`/${lang}/customers/${customer.id}/add-debt`} className="flex flex-col items-center justify-center gap-2 bg-[#18181b] text-white py-3.5 rounded-2xl font-bold hover:bg-[#27272a] active:scale-95 transition-all text-[11px]">
              <span className="material-symbols-outlined text-[#a3e635] text-xl">add_circle</span>{t.addDebt}
            </Link>
            <Link href={`/${lang}/new-order?customer=${customer.id}`} className="flex flex-col items-center justify-center gap-2 bg-zinc-100 text-[#18181b] py-3.5 rounded-2xl font-bold hover:bg-zinc-200 active:scale-95 transition-all text-[11px] border border-zinc-200/80">
              <span className="material-symbols-outlined text-xl">receipt_long</span>{orderDict.newOrder}
            </Link>
            <Link href={`/${lang}/customers/${customer.id}/record-payment`} className="flex flex-col items-center justify-center gap-2 bg-[#a3e635] text-[#121212] py-3.5 rounded-2xl font-black hover:opacity-95 active:scale-95 transition-all text-[11px] shadow-md shadow-[#a3e635]/20">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>{t.recordPayment}
            </Link>
          </div>
        </div>

        {/* Transaction History */}
        <section className="space-y-4">
          <h3 className="text-lg font-extrabold text-[#18181b]">{t.transactionHistory}</h3>
          {transactions.length === 0 ? (
            <p className="text-zinc-500 text-sm text-center py-8 bg-white rounded-3xl border border-zinc-200/80">{t.noTransactions}</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => {
                const isPayment = tx.type === "payment";
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/80 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 ${isPayment ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"} rounded-2xl flex items-center justify-center`}>
                        <span className="material-symbols-outlined" style={isPayment ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                          {isPayment ? "check_circle" : "shopping_basket"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#18181b] text-sm">{tx.description ?? (isPayment ? paymentDict.recordPayment : debtDict.recordDebt)}</p>
                          {tx.isPending && (
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-black text-[9px] lowercase border border-amber-200">
                              ⏳ pending
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {new Date(tx.created_at).toLocaleDateString(lang, {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-black ${isPayment ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPayment ? "+" : "-"}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold">FCFA</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 pb-8">
          <div className="bg-[#18181b] text-white p-5 rounded-3xl shadow-sm border border-zinc-800">
            <span className="material-symbols-outlined mb-2 text-[#a3e635]">calendar_month</span>
            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">{t.activeSince}</p>
            <p className="text-lg font-extrabold text-white mt-1">
              {new Date(customer.created_at).toLocaleDateString(lang, { month: "short", year: "numeric" })}
            </p>
          </div>
          <div className="bg-zinc-100 p-5 rounded-3xl border border-zinc-200/80">
            <span className="material-symbols-outlined mb-2 text-[#18181b]">trending_up</span>
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">{t.status}</p>
            <p className="text-lg font-extrabold text-[#18181b] mt-1">{customer.balance <= 0 ? t.cleared : t.active}</p>
          </div>
        </section>
      </main>
    </div>
  );
}
