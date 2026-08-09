"use client";

import { useActionState, useState } from "react";
import { recordPayment } from "@/app/actions/transactions";
import { queueOfflineTransaction } from "@/app/lib/syncEngine";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/app/lib/i18n";

type Props = {
  id: string;
  t: Dictionary["payment"];
};

export default function RecordPaymentForm({ id, t }: Props) {
  const router = useRouter();
  const [method, setMethod] = useState<"cash" | "mtn" | "orange">("cash");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [state, action, pending] = useActionState(recordPayment, undefined);

  const isValid = Number(amount) > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      await queueOfflineTransaction("payment", {
        customer_id: id,
        amount: Number(amount),
        method,
        reference: reference.trim() || undefined,
      });
      setOfflineMessage("Saved offline! Payment queued to sync when internet returns.");
      setTimeout(() => {
        router.push(`/customers/${id}`);
      }, 1500);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex-1 flex flex-col">
      <input type="hidden" name="customer_id" value={id} />
      <input type="hidden" name="method" value={method} />

      <main className="flex-1 px-6 pb-32">
        <div className="max-w-md mx-auto space-y-8">
          {/* Amount */}
          <section className="mt-8 text-center">
            <label className="text-[0.6875rem] font-medium text-[#424843] mb-2 block uppercase tracking-widest">
              {t.amountPaid}
            </label>
            <div className="flex items-baseline justify-center gap-2">
              <input
                name="amount"
                type="number"
                inputMode="numeric"
                placeholder="0"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-[3.5rem] font-black bg-transparent border-none text-center focus:ring-0 p-0 w-48 text-[#183524]"
              />
              <span className="text-[1.75rem] font-bold text-[#424843] opacity-40">FCFA</span>
            </div>
            {state?.errors?.amount && (
              <p className="text-[#ba1a1a] text-xs mt-2">{state.errors.amount[0]}</p>
            )}
            <div className="w-16 h-1 bg-[#9d4300] mx-auto mt-4 rounded-full" />
          </section>

          {/* Method */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#191c1d]">{t.paymentMethod}</h2>
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  { value: "cash" as const, icon: "payments", label: t.cash, sub: t.cashSub, bg: "bg-[#e7e8e9]", iconColor: "text-[#183524]" },
                  { value: "mtn" as const, label: t.mtn, sub: t.mtnSub, bg: "bg-[#FFCC00]" },
                  { value: "orange" as const, label: t.orange, sub: t.orangeSub, bg: "bg-[#FF6600]" },
                ]
              ).map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`relative flex items-center p-4 rounded-xl transition-all text-left ${method === m.value ? "bg-white ring-2 ring-[#183524]" : "bg-white hover:bg-[#f3f4f5]"}`}
                >
                  <div className={`w-12 h-12 rounded-full ${m.bg} flex items-center justify-center mr-4 shrink-0`}>
                    {"icon" in m ? (
                      <span className={`material-symbols-outlined ${"iconColor" in m ? m.iconColor : ""}`}>{m.icon}</span>
                    ) : (
                      <span className="text-white font-black text-xs">{m.value.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#191c1d]">{m.label}</p>
                    <p className="text-xs text-[#424843]">{m.sub}</p>
                  </div>
                  {method === m.value && (
                    <div className="w-6 h-6 bg-[#183524] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Reference */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-[#191c1d]">
              {t.referenceOptional} <span className="text-xs font-normal opacity-50">({t.optional})</span>
            </h2>
            <input
              name="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-[#e1e3e4] border-none rounded-xl py-4 px-5 text-[#191c1d] placeholder:text-[#424843]/40 focus:ring-2 focus:ring-[#183524]/20 transition-all"
              placeholder={t.referencePlaceholder}
              type="text"
            />
          </section>

          {offlineMessage && (
            <p className="text-[#183524] font-bold text-sm text-center bg-emerald-100 border border-emerald-300 px-4 py-3 rounded-xl">
              {offlineMessage}
            </p>
          )}

          {state?.message && (
            <p className="text-[#ba1a1a] text-sm text-center bg-[#ffdad6] px-4 py-3 rounded-xl">
              {state.message}
            </p>
          )}

          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-sm">{t.verifiedTitle}</p>
              <p className="text-emerald-700 text-xs">{t.verifiedDesc}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 bg-[#f8f9fa]/80 backdrop-blur-md">
        <div className="max-w-md mx-auto">
          <button
            type="submit"
            disabled={pending || !isValid}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            {pending ? t.processing : t.confirmPayment}
          </button>
        </div>
      </footer>
    </form>
  );
}
