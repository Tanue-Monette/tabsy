"use client";

import { useState } from "react";
import Link from "next/link";
import type { OrderListItem } from "@/app/actions/orders";
import type { Dictionary } from "@/app/lib/i18n";
import PaginationControls from "@/app/components/PaginationControls";

type Props = {
  orders: OrderListItem[];
  lang: string;
  t: Dictionary["orders"];
};

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  cash: { label: "Cash", className: "text-emerald-700 bg-emerald-50 border-emerald-100" },
  mtn: { label: "MTN MoMo", className: "text-amber-700 bg-amber-50 border-amber-100" },
  orange: { label: "Orange Money", className: "text-orange-700 bg-orange-50 border-orange-100" },
  credit: { label: "Debt", className: "text-rose-600 bg-rose-50 border-rose-100" },
};

export default function OrdersListClient({ orders, lang, t }: Props) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setCurrentPage(1);
  };

  const filtered = orders.filter((o) => {
    const name = o.customer?.name?.toLowerCase() ?? "";
    return name.includes(search.toLowerCase().trim()) || (!o.customer && t.walkIn.toLowerCase().includes(search.toLowerCase().trim()));
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoComplete="off"
          className="w-full h-14 bg-zinc-200/60 border-none rounded-2xl pl-12 pr-10 focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-500 font-medium"
          placeholder={t.searchPlaceholder}
          type="text"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200/80">
          <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3 block">
            {search ? "search_off" : "receipt_long"}
          </span>
          <p className="text-zinc-600 font-semibold">{search ? `No results for "${search}"` : t.noOrders}</p>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paginated.map((order) => {
            const badge = PAYMENT_BADGE[order.payment_type] ?? PAYMENT_BADGE.cash;
            const date = new Date(order.created_at);
            return (
              <Link
                key={order.id}
                href={`/${lang}/orders/${order.id}`}
                className="bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-sm flex flex-col gap-2 min-w-0 active:scale-[0.98] transition-all"
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center font-black text-base bg-zinc-100 text-zinc-500 shrink-0">
                    {(order.customer?.name ?? t.walkIn)[0].toUpperCase()}
                  </div>
                  <span className={`text-[9px] uppercase tracking-tight font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                <div className="min-w-0">
                  <h3 className="font-extrabold text-[#18181b] text-sm truncate">
                    {order.customer?.name ?? t.walkIn}
                  </h3>
                  <p className="text-zinc-400 text-[11px] font-medium truncate">
                    {order.item_count} {order.item_count === 1 ? t.item : t.items} · {date.toLocaleDateString()}
                  </p>
                </div>

                <span className="font-black text-[#18181b] text-sm mt-1">
                  {order.total_amount.toLocaleString()} FCFA
                </span>
              </Link>
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
    </div>
  );
}
