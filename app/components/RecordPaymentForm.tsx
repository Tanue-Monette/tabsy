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
          <section className="mt-6 text-center">
            <label className="text-[10px] font-bold text-zinc-400 mb-2 block uppercase tracking-wider">
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
                className="text-[3.5rem] font-black bg-transparent border-none text-center focus:ring-0 p-0 w-48 text-[#18181b]"
              />
              <span className="text-xl font-black text-[#a3e635]">FCFA</span>
            </div>
            {state?.errors?.amount && (
              <p className="text-rose-600 text-xs mt-2">{state.errors.amount[0]}</p>
            )}
            <div className="w-16 h-1 bg-[#a3e635] mx-auto mt-4 rounded-full" />
          </section>

          {/* Method */}
          <section className="space-y-4">
            <h2 className="text-base font-extrabold text-[#18181b]">{t.paymentMethod}</h2>
            <div className="grid grid-cols-1 gap-3">
              {(
                [
                  { value: "cash" as const, icon: "payments", label: t.cash, sub: t.cashSub, bg: "bg-[#18181b]", iconColor: "text-[#a3e635]" },
                  { value: "mtn" as const, label: t.mtn, sub: t.mtnSub, bg: "bg-[#FFCC00]" },
                  { value: "orange" as const, label: t.orange, sub: t.orangeSub, bg: "bg-[#FF6600]" },
                ]
              ).map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`relative flex items-center p-4 rounded-2xl transition-all text-left border ${method === m.value ? "bg-white border-[#18181b] ring-2 ring-[#18181b]/10 shadow-sm" : "bg-white border-zinc-200/80 hover:bg-zinc-50"}`}
                >
                  <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center mr-4 shrink-0`}>
                    {"icon" in m ? (
                      <span className={`material-symbols-outlined ${"iconColor" in m ? m.iconColor : ""}`}>{m.icon}</span>
                    ) : (
                      <span className="text-white font-black text-xs">{m.value.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-sm text-[#18181b]">{m.label}</p>
                    <p className="text-xs text-zinc-400 font-medium">{m.sub}</p>
                  </div>
                  {method === m.value && (
                    <div className="w-6 h-6 bg-[#18181b] rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#a3e635] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Reference */}
          <section className="space-y-3">
            <h2 className="text-base font-extrabold text-[#18181b]">
              {t.referenceOptional} <span className="text-xs font-normal text-zinc-400">({t.optional})</span>
            </h2>
            <input
              name="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full bg-zinc-100 border-none rounded-2xl py-4 px-5 text-[#18181b] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#18181b] transition-all font-medium"
              placeholder={t.referencePlaceholder}
              type="text"
            />
          </section>

          {offlineMessage && (
            <p className="text-[#18181b] font-bold text-sm text-center bg-[#a3e635]/20 border border-[#a3e635] px-4 py-3 rounded-2xl">
              {offlineMessage}
            </p>
          )}

          {state?.message && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
              {state.message}
            </p>
          )}

          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <p className="text-emerald-900 font-bold text-xs">{t.verifiedTitle}</p>
              <p className="text-emerald-700 text-[11px] font-medium">{t.verifiedDesc}</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-zinc-100">
        <div className="max-w-md mx-auto">
          <button
            type="submit"
            disabled={pending || !isValid}
            className="w-full py-4 rounded-2xl bg-[#a3e635] text-[#121212] font-black text-base shadow-lg shadow-[#a3e635]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
            {pending ? t.processing : t.confirmPayment}
          </button>
        </div>
      </footer>
    </form>
  );
}
