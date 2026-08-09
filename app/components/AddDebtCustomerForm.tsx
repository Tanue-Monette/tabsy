"use client";

import { useActionState, useState } from "react";
import { addDebtWithCustomer } from "@/app/actions/customers";
import { queueOfflineTransaction } from "@/app/lib/syncEngine";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/app/lib/i18n";

const QUICK_TAGS = ["Rice", "Sugar", "Soap", "Oil", "Flour", "Salt"];

type Props = {
  id: string;
  t: Dictionary["debt"];
};

export default function AddDebtCustomerForm({ id, t }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addDebtWithCustomer, undefined);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const isValid = Number(amount) > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      await queueOfflineTransaction("debt", {
        customer_id: id,
        amount: Number(amount),
        description: description.trim() || undefined,
      });
      setOfflineMessage("Saved offline! Debt transaction queued to sync when internet returns.");
      setTimeout(() => {
        router.push(`/customers/${id}`);
      }, 1500);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex-grow flex flex-col">
      <input type="hidden" name="customer_id" value={id} />

      <main className="flex-grow px-6 -mt-4 pb-4">
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
          {/* Amount */}
          <div className="text-center">
            <label className="block text-sm font-medium text-[#424843] mb-2" htmlFor="amount">
              {t.debtAmount}
            </label>
            <div className="inline-flex items-baseline justify-center w-full">
              <input
                id="amount"
                name="amount"
                type="number"
                inputMode="numeric"
                placeholder="0"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-center text-6xl font-extrabold tracking-tighter bg-transparent border-none focus:ring-0 text-[#183524] p-0"
              />
              <span className="ml-2 text-2xl font-bold text-[#191c1d]/40">FCFA</span>
            </div>
            {state?.errors?.amount && (
              <p className="text-[#ba1a1a] text-xs mt-2">{state.errors.amount[0]}</p>
            )}
            <div className="h-1 w-24 bg-[#fd761a] mx-auto mt-3 rounded-full opacity-50" />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#424843] uppercase tracking-widest mb-2 px-1">
              {t.descriptionOptional}
            </label>
            <div className="bg-[#e1e3e4] rounded-xl px-4 py-4">
              <input
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[#191c1d] font-medium w-full p-0 placeholder:text-[#727972]/50"
                placeholder={t.descriptionPlaceholder}
                type="text"
              />
            </div>
          </div>

          {/* Quick tags */}
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((tag) => {
              const active = description.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDescription((prev) =>
                      active
                        ? prev.replace(`, ${tag}`, "").replace(tag, "").replace(/^,\s*/, "").trim()
                        : prev ? `${prev}, ${tag}` : tag
                    );
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setDescription((prev) =>
                      active
                        ? prev.replace(`, ${tag}`, "").replace(tag, "").replace(/^,\s*/, "").trim()
                        : prev ? `${prev}, ${tag}` : tag
                    );
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-[#183524] text-white" : "bg-[#edeeef] text-[#424843]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {offlineMessage && (
          <p className="mt-4 text-[#183524] font-bold text-sm text-center bg-emerald-100 border border-emerald-300 px-4 py-3 rounded-xl">
            {offlineMessage}
          </p>
        )}

        {state?.message && (
          <p className="mt-4 text-[#ba1a1a] text-sm text-center bg-[#ffdad6] px-4 py-3 rounded-xl">
            {state.message}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
          <span className="material-symbols-outlined text-[#9d4300]">info</span>
          <p className="text-xs text-[#5c2400] leading-relaxed">
            {t.infoExisting}
          </p>
        </div>
      </main>

      <footer className="p-6 bg-white">
        <button
          type="submit"
          disabled={pending || !isValid}
          className="w-full py-5 bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white rounded-xl font-bold text-lg shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">save</span>
          {pending ? t.saving : t.saveDebt}
        </button>
      </footer>
    </form>
  );
}
