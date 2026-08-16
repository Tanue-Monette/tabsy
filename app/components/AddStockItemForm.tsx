"use client";

import { useActionState } from "react";
import { addStockItem } from "@/app/actions/stock";
import type { Dictionary } from "@/app/lib/i18n";

type Props = { t: Dictionary["stock"] };

export default function AddStockItemForm({ t }: Props) {
  const [state, action, pending] = useActionState(addStockItem, undefined);

  return (
    <form action={action} className="flex-grow flex flex-col">
      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="name">
              {t.itemName}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder={t.itemNamePlaceholder}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
            />
            {state?.errors?.name && <p className="text-rose-600 text-xs mt-2">{state.errors.name[0]}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="unit">
                {t.unit}
              </label>
              <input
                id="unit"
                name="unit"
                type="text"
                defaultValue="pcs"
                placeholder={t.unitPlaceholder}
                className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="quantity">
                {t.openingQuantity}
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue="0"
                className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="cost_price">
                {t.costPrice}
              </label>
              <input
                id="cost_price"
                name="cost_price"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue="0"
                className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="sell_price">
                {t.sellPrice}
              </label>
              <input
                id="sell_price"
                name="sell_price"
                type="number"
                inputMode="numeric"
                min="0"
                defaultValue="0"
                className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="low_stock_threshold">
              {t.lowStockThreshold}
            </label>
            <input
              id="low_stock_threshold"
              name="low_stock_threshold"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue="5"
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
            />
            <p className="text-zinc-400 text-xs mt-2 px-1">{t.lowStockThresholdSub}</p>
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
          className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[#a3e635]">save</span>
          {pending ? t.saving : t.saveItem}
        </button>
      </footer>
    </form>
  );
}
