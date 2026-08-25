"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { updateStockItem } from "@/app/actions/stock";
import PacksEditor from "@/app/components/PacksEditor";
import type { Dictionary } from "@/app/lib/i18n";

type Item = {
  id: string;
  name: string;
  unit: string;
  cost_price: number;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
  stock_item_packs: { id: string; name: string; size: number }[];
};

type Props = { item: Item; t: Dictionary["stock"]; lang: string };

const PRESET_UNITS = [
  "pcs",
  "kg",
  "g",
  "liter",
  "ml",
  "bottle",
  "box",
  "bag",
  "pack",
  "can",
  "crate",
  "sachet",
  "unit",
  "custom",
];

export default function EditStockItemForm({ item, t, lang }: Props) {
  const [state, action, pending] = useActionState(updateStockItem, undefined);
  const isPreset = PRESET_UNITS.slice(0, -1).includes(item.unit);

  // Controlled form states to track modifications
  const [name, setName] = useState(item.name);
  const [selectedUnit, setSelectedUnit] = useState(isPreset ? item.unit : "custom");
  const [customUnit, setCustomUnit] = useState(isPreset ? "" : item.unit);
  const [costPrice, setCostPrice] = useState(String(item.cost_price));
  const [sellPrice, setSellPrice] = useState(String(item.sell_price));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(item.low_stock_threshold));
  const [packs, setPacks] = useState(item.stock_item_packs);

  // Derive effective unit string
  const effectiveUnit = selectedUnit === "custom" ? customUnit.trim() : selectedUnit;

  // Determine if any value has changed from the initial record
  const isDirty = useMemo(() => {
    if (name.trim() !== item.name.trim()) return true;
    if (effectiveUnit !== item.unit) return true;

    const numCost = parseFloat(costPrice);
    if (!isNaN(numCost) && numCost !== item.cost_price) return true;

    const numSell = parseFloat(sellPrice);
    if (!isNaN(numSell) && numSell !== item.sell_price) return true;

    const numThresh = parseInt(lowStockThreshold, 10);
    if (!isNaN(numThresh) && numThresh !== item.low_stock_threshold) return true;

    if (JSON.stringify(packs) !== JSON.stringify(item.stock_item_packs)) return true;

    return false;
  }, [name, effectiveUnit, costPrice, sellPrice, lowStockThreshold, packs, item]);

  return (
    <form action={action} className="flex-grow flex flex-col">
      <input type="hidden" name="stock_item_id" value={item.id} />

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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.itemNamePlaceholder}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
            />
            {state?.errors?.name && <p className="text-rose-600 text-xs mt-2">{state.errors.name[0]}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="unit_select">
              {t.unit}
            </label>
            <select
              id="unit_select"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-extrabold cursor-pointer"
            >
              {PRESET_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u === "custom" ? "Other (Custom...)" : u}
                </option>
              ))}
            </select>
            {selectedUnit === "custom" ? (
              <input
                id="unit"
                name="unit"
                type="text"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
                placeholder={t.unitPlaceholder ?? "e.g. bundle"}
                className="w-full h-14 px-4 mt-2 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
              />
            ) : (
              <input type="hidden" name="unit" value={selectedUnit} />
            )}
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
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
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
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
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
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] font-medium"
            />
            <p className="text-zinc-400 text-xs mt-2 px-1">{t.lowStockThresholdSub}</p>
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-100 rounded-2xl">
            <span className="material-symbols-outlined text-zinc-500 text-lg">info</span>
            <p className="text-zinc-500 text-xs leading-relaxed flex-1">
              {t.currentQuantity}: <span className="font-bold text-[#18181b]">{item.quantity.toLocaleString()} {item.unit}</span>
              {" · "}{t.editQuantityHint}
            </p>
          </div>

          <Link
            href={`/${lang}/stock/${item.id}/adjust`}
            className="flex items-center justify-center gap-2 text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 py-3 rounded-2xl font-bold text-xs transition-colors"
          >
            <span className="material-symbols-outlined text-base">edit_note</span>
            {t.adjustStockLink}
          </Link>
        </div>

        <PacksEditor initialPacks={packs} onChange={setPacks} t={t} />

        {state?.message && (
          <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
            {state.message}
          </p>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-zinc-100">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#a3e635]">save</span>
          {pending ? t.saving : t.saveChanges}
        </button>
      </footer>
    </form>
  );
}
