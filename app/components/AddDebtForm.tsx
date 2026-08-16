"use client";

import { useActionState, useState } from "react";
import { addDebtWithCustomer } from "@/app/actions/customers";
import { queueOfflineTransaction } from "@/app/lib/syncEngine";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/app/lib/i18n";

const QUICK_TAGS = ["Rice", "Sugar", "Soap", "Oil", "Flour", "Salt"];

type Props = {
  lang: string;
  t: Dictionary["debt"];
};

export default function AddDebtForm({ lang, t }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(addDebtWithCustomer, undefined);
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const isValid = Number(amount) > 0 && name.trim().length >= 1;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      await queueOfflineTransaction("add_debt_with_customer", {
        new_name: name.trim(),
        new_phone: phone.trim() || undefined,
        amount: Number(amount),
        description: description.trim() || undefined,
      });
      setOfflineMessage("Saved offline! Transaction queued to sync when internet returns.");
      setTimeout(() => {
        router.push(`/${lang}/customers`);
      }, 1500);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex-grow flex flex-col">
      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-6">

          {/* Amount */}
          <div className="text-left">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="amount">
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
                className="w-full text-center text-6xl font-black tracking-tighter bg-transparent border-none focus:ring-0 text-[#18181b] p-0"
              />
              <span className="ml-2 text-xl font-black text-[#a3e635]">FCFA</span>
            </div>
            {state?.errors?.amount && (
              <p className="text-rose-600 text-xs mt-2">{state.errors.amount[0]}</p>
            )}
            <div className="h-1 w-full bg-[#a3e635] mx-auto mt-3 rounded-full" />
          </div>

          {/* New customer fields */}
          <div className="space-y-3">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
              {t.customer}
            </label>
            <input
              name="new_name"
              type="text"
              placeholder={t.customerName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
            />
            {state?.errors?.new_name && (
              <p className="text-rose-600 text-xs ml-1">{state.errors.new_name[0]}</p>
            )}
            <input
              name="new_phone"
              type="tel"
              placeholder={t.phoneOptional}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 px-1">
              {t.descriptionOptional}
            </label>
            <div className="bg-zinc-100 rounded-2xl px-4 py-4">
              <input
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-[#18181b] font-medium w-full p-0 placeholder:text-zinc-400"
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${active ? "bg-[#18181b] text-[#a3e635]" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

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

        <div className="flex items-center gap-3 p-4 bg-zinc-100 border border-zinc-200/80 rounded-2xl">
          <span className="material-symbols-outlined text-[#18181b]">info</span>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            {t.infoNew}
          </p>
        </div>
      </main>

      <footer className="p-6 bg-white border-t border-zinc-100">
        <button
          type="submit"
          disabled={pending || !isValid}
          className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[#a3e635]">save</span>
          {pending ? t.saving : t.saveDebt}
        </button>
      </footer>
    </form>
  );
}
