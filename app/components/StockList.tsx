"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/app/lib/i18n";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
};

type Filter = "all" | "low" | "out";

export default function StockList({
  items,
  lang,
  t,
}: {
  items: StockItem[];
  lang: string;
  t: Dictionary["stock"];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.allItems },
    { key: "low", label: t.lowStock },
    { key: "out", label: t.outOfStock },
  ];

  const filtered = items
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase().trim()))
    .filter((i) => {
      if (filter === "low") return i.quantity > 0 && i.quantity <= i.low_stock_threshold;
      if (filter === "out") return i.quantity <= 0;
      return true;
    });

  return (
    <section className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          autoComplete="off"
          className="w-full h-14 bg-zinc-200/60 border-none rounded-2xl pl-12 pr-10 focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-500 font-medium"
          placeholder={t.searchPlaceholder}
          type="text"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              filter === f.key ? "bg-[#18181b] text-[#a3e635]" : "bg-zinc-200/70 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200/80">
          <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3 block">
            {search ? "search_off" : "inventory_2"}
          </span>
          <p className="text-zinc-600 font-semibold">
            {search ? `No results for "${search}"` : t.noItems}
          </p>
          {!search && <p className="text-zinc-400 text-xs mt-1">{t.addFirst}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isOut = item.quantity <= 0;
            const isLow = !isOut && item.quantity <= item.low_stock_threshold;
            const statusLabel = isOut ? t.out : isLow ? t.low : t.inStock;
            const statusColor = isOut
              ? "text-rose-600 bg-rose-50 border-rose-100"
              : isLow
              ? "text-amber-700 bg-amber-50 border-amber-100"
              : "text-emerald-700 bg-emerald-50 border-emerald-100";

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-3xl flex items-center justify-between border border-zinc-200/80 shadow-sm"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg bg-zinc-100 text-zinc-500 shrink-0">
                    {item.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#18181b] text-base truncate">{item.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium">
                      {item.quantity.toLocaleString()} {item.unit} · {item.sell_price.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] uppercase tracking-tight font-bold px-2 py-1 rounded-lg border ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <Link
                    href={`/${lang}/stock/${item.id}/restock`}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#18181b] text-[#a3e635] active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
