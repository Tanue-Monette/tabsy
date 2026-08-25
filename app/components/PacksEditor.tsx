"use client";

import { useState } from "react";
import type { Dictionary } from "@/app/lib/i18n";

type PackRow = { name: string; size: string };

type Props = {
  initialPacks?: { id?: string; name: string; size: number }[];
  onChange?: (packs: { id: string; name: string; size: number }[]) => void;
  t: Dictionary["stock"];
};

export default function PacksEditor({ initialPacks = [], onChange, t }: Props) {
  const [packs, setPacks] = useState<PackRow[]>(
    initialPacks.map((p) => ({ name: p.name, size: String(p.size) }))
  );

  function notifyChange(newPacks: PackRow[]) {
    if (onChange) {
      const validPacks = newPacks
        .filter((p) => p.name.trim().length > 0 && p.size !== "")
        .map((p, idx) => ({ id: `pack_${idx}`, name: p.name.trim(), size: Number(p.size) }));
      onChange(validPacks);
    }
  }

  function addRow() {
    setPacks((prev) => {
      const next = [...prev, { name: "", size: "" }];
      notifyChange(next);
      return next;
    });
  }

  function updateRow(index: number, field: "name" | "size", value: string) {
    setPacks((prev) => {
      const next = prev.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      notifyChange(next);
      return next;
    });
  }

  function removeRow(index: number) {
    setPacks((prev) => {
      const next = prev.filter((_, i) => i !== index);
      notifyChange(next);
      return next;
    });
  }

  const packsJson = JSON.stringify(
    packs
      .filter((p) => p.name.trim().length > 0 && p.size !== "")
      .map((p) => ({ name: p.name.trim(), size: Number(p.size) }))
  );

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-200/80 space-y-3">
      <input type="hidden" name="packs" value={packsJson} />

      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.packsLabel}</label>
          <p className="text-zinc-400 text-xs mt-1">{t.packsHint}</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="shrink-0 flex items-center gap-1 text-xs font-bold text-[#18181b] bg-zinc-100 hover:bg-zinc-200 px-3 py-2 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {t.addPack}
        </button>
      </div>

      {packs.length === 0 ? (
        <p className="text-zinc-300 text-xs italic pt-1">{t.noPacks}</p>
      ) : (
        <div className="space-y-2 pt-1">
          {packs.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={p.name}
                onChange={(e) => updateRow(i, "name", e.target.value)}
                placeholder={t.packNamePlaceholder}
                className="flex-1 h-12 px-3 bg-zinc-100 border-none rounded-xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] text-sm font-medium"
              />
              <input
                value={p.size}
                onChange={(e) => updateRow(i, "size", e.target.value)}
                type="number"
                inputMode="numeric"
                min="0"
                step="any"
                placeholder={t.packSizePlaceholder}
                className="w-20 h-12 px-3 bg-zinc-100 border-none rounded-xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] text-sm font-medium text-center"
              />
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
