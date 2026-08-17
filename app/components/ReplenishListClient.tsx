"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/app/lib/i18n";
import PaginationControls from "@/app/components/PaginationControls";

type ReplenishItem = {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  low_stock_threshold: number;
};

type Props = {
  items: ReplenishItem[];
  lang: string;
  t: Dictionary["stock"];
};

export default function ReplenishListClient({ items, lang, t }: Props) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setCurrentPage(1);
  };

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoComplete="off"
          className="w-full h-14 bg-zinc-200/60 border-none rounded-2xl pl-12 pr-10 focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-500 font-medium"
          placeholder={t.searchPlaceholder ?? "Search item"}
          type="text"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200/80">
          <span className="material-symbols-outlined text-4xl text-emerald-400 mb-3 block">
            {search ? "search_off" : "check_circle"}
          </span>
          <p className="text-zinc-600 font-semibold">
            {search ? `No items matching "${search}"` : t.replenishmentEmpty}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((item) => {
            const isOut = item.quantity <= 0;
            return (
              <Link
                key={item.id}
                href={`/${lang}/stock/${item.id}/restock`}
                className="bg-white p-4 rounded-3xl flex items-center justify-between border border-zinc-200/80 shadow-sm active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isOut ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                    }`}
                  >
                    <span className="material-symbols-outlined">{isOut ? "remove_shopping_cart" : "warning"}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-[#18181b] text-base truncate">{item.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium">
                      {t.currentQuantity}: {item.quantity.toLocaleString()} {item.unit} · {t.threshold}: {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-400 text-lg shrink-0">chevron_right</span>
              </Link>
            );
          })}

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
        </div>
      )}
    </div>
  );
}
