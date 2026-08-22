"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { adjustStockItem } from "@/app/actions/stock";
import type { Dictionary } from "@/app/lib/i18n";

type Mode = "set" | "delta";
type Direction = "add" | "remove";

type Props = {
  item: { id: string; name: string; unit: string; quantity: number };
  t: Dictionary["stock"];
};

export default function AdjustStockForm({ item, t }: Props) {
  const [state, action, pending] = useActionState(adjustStockItem, undefined);

  const [mode, setMode] = useState<Mode>("set");
  const [direction, setDirection] = useState<Direction>("add");
  const [setValue, setSetValue] = useState(String(item.quantity));
  const [deltaValue, setDeltaValue] = useState("");
  const [note, setNote] = useState("");

  const newQuantity = useMemo(() => {
    if (mode === "set") {
      const v = Number(setValue);
      return Number.isFinite(v) ? v : item.quantity;
    }
    const v = Number(deltaValue) || 0;
    return direction === "add" ? item.quantity + v : item.quantity - v;
  }, [mode, setValue, deltaValue, direction, item.quantity]);

  const delta = newQuantity - item.quantity;
  const isInvalid = newQuantity < 0;
  const isNoOp = delta === 0;

  return (
    <form action={action} className="flex-grow flex flex-col">
      <input type="hidden" name="stock_item_id" value={item.id} />
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="direction" value={direction} />
      <input type="hidden" name="value" value={mode === "set" ? setValue : deltaValue} />

      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-6">
          <div className="text-center">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wide">{t.currentQuantity}</p>
            <p className="text-2xl font-black text-[#18181b]">
              {item.quantity.toLocaleString()} <span className="text-sm text-zinc-400">{item.unit}</span>
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2 bg-zinc-100 rounded-2xl p-1.5">
            <button
              type="button"
              onClick={() => setMode("set")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === "set" ? "bg-white text-[#18181b] shadow-sm" : "text-zinc-500"
              }`}
            >
              {t.setExactQuantity}
            </button>
            <button
              type="button"
              onClick={() => setMode("delta")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                mode === "delta" ? "bg-white text-[#18181b] shadow-sm" : "text-zinc-500"
              }`}
            >
              {t.addOrRemove}
            </button>
          </div>

          {mode === "set" ? (
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="set_value">
                {t.correctQuantityLabel}
              </label>
              <input
                id="set_value"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                autoFocus
                value={setValue}
                onChange={(e) => setSetValue(e.target.value)}
                className="w-full text-center text-5xl font-black tracking-tighter bg-transparent border-none focus:ring-0 text-[#18181b] p-0"
              />
              <div className="h-1 w-full bg-amber-400 mx-auto mt-3 rounded-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDirection("add")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    direction === "add" ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {t.add}
                </button>
                <button
                  type="button"
                  onClick={() => setDirection("remove")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    direction === "remove" ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">remove</span>
                  {t.remove}
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="delta_value">
                  {t.adjustmentAmountLabel}
                </label>
                <input
                  id="delta_value"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  autoFocus
                  value={deltaValue}
                  onChange={(e) => setDeltaValue(e.target.value)}
                  placeholder="0"
                  className="w-full text-center text-5xl font-black tracking-tighter bg-transparent border-none focus:ring-0 text-[#18181b] p-0"
                />
                <div className="h-1 w-full bg-amber-400 mx-auto mt-3 rounded-full" />
              </div>
            </div>
          )}

          {/* Live preview */}
          <div
            className={`rounded-2xl p-4 text-center ${
              isInvalid ? "bg-rose-50 border border-rose-100" : "bg-zinc-50 border border-zinc-100"
            }`}
          >
            <p className="text-zinc-400 text-[11px] uppercase tracking-wide font-semibold mb-1">
              {t.newQuantityWillBe}
            </p>
            <p className={`text-xl font-black ${isInvalid ? "text-rose-600" : "text-[#18181b]"}`}>
              {isInvalid ? t.negativeStockError : `${newQuantity.toLocaleString()} ${item.unit}`}
            </p>
            {!isInvalid && !isNoOp && (
              <p className="text-zinc-400 text-xs mt-1">
                {delta > 0 ? "+" : ""}
                {delta.toLocaleString()} {item.unit}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2" htmlFor="note">
              {t.reasonLabel}
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t.reasonPlaceholder}
              className="w-full px-4 py-3 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium resize-none"
            />
            {state?.errors?.note && <p className="text-rose-600 text-xs mt-2">{state.errors.note[0]}</p>}
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
          disabled={pending || isInvalid || note.trim().length < 3}
          className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-base shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">edit_note</span>
          {pending ? t.saving : t.confirmAdjustment}
        </button>
      </footer>
    </form>
  );
}
