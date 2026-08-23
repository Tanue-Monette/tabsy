"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { db } from "@/app/lib/db";
import { cacheOnlineStockItems, subscribeSyncStatus } from "@/app/lib/syncEngine";
import type { Dictionary } from "@/app/lib/i18n";
import PaginationControls from "@/app/components/PaginationControls";

type StockItem = {
  id: string;
  name: string;
  unit: string;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
  stock_item_packs?: { id: string; name: string; size: number }[];
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [allStockItems, setAllStockItems] = useState<StockItem[]>(items);

  useEffect(() => {
    cacheOnlineStockItems(items);

    const loadLocalStock = async () => {
      try {
        const local = await db.cachedStockItems.toArray();
        if (local.length > 0) {
          setAllStockItems(local);
        }
      } catch (err) {
        console.error("Dexie read error:", err);
      }
    };

    loadLocalStock();
    const unsubscribe = subscribeSyncStatus(loadLocalStock);
    return () => unsubscribe();
  }, [items]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "all", label: t.allItems },
    { key: "low", label: t.lowStock },
    { key: "out", label: t.outOfStock },
  ];

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (key: Filter) => {
    setFilter(key);
    setCurrentPage(1);
  };

  const filtered = allStockItems
    .filter((i) => i.name.toLowerCase().includes(search.toLowerCase().trim()))
    .filter((i) => {
      if (filter === "low") return i.quantity > 0 && i.quantity <= i.low_stock_threshold;
      if (filter === "out") return i.quantity <= 0;
      return true;
    });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          onInput={(e) => handleSearchChange((e.target as HTMLInputElement).value)}
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
            onClick={() => handleFilterChange(f.key)}
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
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginated.map((item) => {
            const isOut = item.quantity <= 0;
            const isLow = !isOut && item.quantity <= item.low_stock_threshold;
            const statusLabel = isOut ? t.out : isLow ? t.low : t.inStock;
            const statusColor = isOut
              ? "text-rose-600 bg-rose-50 border-rose-100"
              : isLow
              ? "text-amber-700 bg-amber-50 border-amber-100"
              : "text-emerald-700 bg-emerald-50 border-emerald-100";

            // Show a quick pack breakdown using the largest pack, e.g. "5 Crate + 4 bottles"
            const packs = item.stock_item_packs ?? [];
            const biggestPack = packs.length > 0 ? [...packs].sort((a, b) => b.size - a.size)[0] : null;
            const packBreakdown =
              biggestPack && item.quantity > 0
                ? (() => {
                    const packCount = Math.floor(item.quantity / biggestPack.size);
                    const remainder = item.quantity % biggestPack.size;
                    if (packCount <= 0) return null;
                    return remainder > 0
                      ? `${packCount} ${biggestPack.name} + ${remainder} ${item.unit}`
                      : `${packCount} ${biggestPack.name}`;
                  })()
                : null;

            return (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col gap-2 min-w-0"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-base bg-zinc-100 text-zinc-500 shrink-0">
                    {item.name[0].toUpperCase()}
                  </div>
                  <span className={`text-[9px] uppercase tracking-tight font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                <Link href={`/${lang}/stock/${item.id}/edit`} className="min-w-0">
                  <h3 className="font-extrabold text-[#18181b] text-sm truncate">{item.name}</h3>
                  <p className="text-zinc-500 text-[11px] font-medium truncate">
                    {item.quantity.toLocaleString()} {item.unit} · {item.sell_price.toLocaleString()} FCFA
                  </p>
                  {packBreakdown && <p className="text-zinc-400 text-[10px] mt-0.5 truncate">{packBreakdown}</p>}
                </Link>

                <Link
                  href={`/${lang}/stock/${item.id}/restock`}
                  className="mt-1 w-full flex items-center justify-center gap-1 bg-[#18181b] text-[#a3e635] rounded-xl py-2 text-[11px] font-bold active:scale-95 transition-transform"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  {t.restock}
                </Link>
              </div>
            );
          })}
        </div>

        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
        />
        </>
      )}
    </section>
  );
}
