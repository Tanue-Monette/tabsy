"use client";

import { useActionState } from "react";
import { restockItem } from "@/app/actions/stock";
import type { Dictionary } from "@/app/lib/i18n";

type Props = {
  item: { id: string; name: string; unit: string; quantity: number; cost_price: number };
  t: Dictionary["stock"];
};

export default function RestockForm({ item, t }: Props) {
  const [state, action, pending] = useActionState(restockItem, undefined);

  return (
    <form action={action} className="flex-grow flex flex-col">
      <input type="hidden" name="stock_item_id" value={item.id} />

      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-6">
          <div className="text-center">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">{t.currentQuantity}</p>
            <p className="text-2xl font-black text-[#18181b]">
              {item.quantity.toLocaleString()} <span className="text-sm text-zinc-400">{item.unit}</span>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="quantity">
              {t.quantityReceived}
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              inputMode="numeric"
              min="1"
              autoFocus
              className="w-full text-center text-5xl font-black tracking-tighter bg-transparent border-none focus:ring-0 text-[#18181b] p-0"
              placeholder="0"
            />
            {state?.errors?.quantity && <p className="text-rose-600 text-xs mt-2 text-center">{state.errors.quantity[0]}</p>}
            <div className="h-1 w-full bg-[#a3e635] mx-auto mt-3 rounded-full" />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="unit_cost">
              {t.unitCostOptional}
            </label>
            <input
              id="unit_cost"
              name="unit_cost"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={item.cost_price || ""}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
            />
          </div>
        </div>

        {state?.message && (
          <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
            {state.message}
          </p>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-zinc-100">
        <button
          type="submit"
          disabled={pending}
          className="w-full py-4 bg-[#a3e635] text-[#121212] rounded-2xl font-black text-base shadow-lg shadow-[#a3e635]/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          {pending ? t.saving : t.confirmRestock}
        </button>
      </footer>
    </form>
  );
}
