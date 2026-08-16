"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { db } from "@/app/lib/db";
import { cacheOnlineCustomers, subscribeSyncStatus } from "@/app/lib/syncEngine";

type Customer = {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
};

type Filter = "all" | "overdue" | "cleared" | "recent";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All Debtors" },
  { key: "overdue", label: "Overdue" },
  { key: "cleared", label: "Cleared" },
  { key: "recent", label: "Recent" },
];

export default function CustomerList({ customers, lang }: { customers: Customer[]; lang: string }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [allCustomers, setAllCustomers] = useState<(Customer & { isPending?: boolean })[]>(customers);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cache fetched server customers and listen to local Dexie updates
  useEffect(() => {
    cacheOnlineCustomers(customers);

    const loadLocalCustomers = async () => {
      try {
        const local = await db.cachedCustomers.toArray();
        if (local.length > 0) {
          setAllCustomers(local);
        }
      } catch (err) {
        console.error("Dexie read error:", err);
      }
    };

    loadLocalCustomers();
    const unsubscribe = subscribeSyncStatus(loadLocalCustomers);
    return () => unsubscribe();
  }, [customers]);

  const filtered = allCustomers
    .filter((c) => {
      const q = search.toLowerCase().trim();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? "").includes(q)
      );
    })
    .filter((c) => {
      if (filter === "overdue") return c.balance > 0;
      if (filter === "cleared") return c.balance <= 0;
      return true;
    });

  // Clear: reset both the DOM value and the state
  function handleClear(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (inputRef.current) inputRef.current.value = "";
    setSearch("");
  }

  return (
    <section className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-zinc-400">
          <span className="material-symbols-outlined">search</span>
        </div>
        <input
          ref={inputRef}
          onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
          defaultValue=""
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full h-14 bg-zinc-200/60 border-none rounded-2xl pl-12 pr-10 focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-500 font-medium"
          placeholder="Search customer"
          type="text"
        />
        {search && (
          <button
            type="button"
            onMouseDown={handleClear}
            onTouchEnd={handleClear}
            className="absolute inset-y-0 right-4 flex items-center justify-center w-10 text-zinc-400 hover:text-zinc-600"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onMouseDown={() => setFilter(f.key)}
            onTouchEnd={(e) => { e.preventDefault(); setFilter(f.key); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-[#18181b] text-[#a3e635]"
                : "bg-zinc-200/70 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex justify-between items-center px-1 pt-1">
        <h2 className="text-[#18181b] font-extrabold text-lg">Customers</h2>
        <span className="text-zinc-500 text-xs font-semibold">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-3xl text-center border border-zinc-200/80">
          <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3 block">
            {search ? "search_off" : "group"}
          </span>
          <p className="text-zinc-600 font-semibold">
            {search ? `No results for "${search}"` : "No customers yet."}
          </p>
          {!search && (
            <p className="text-zinc-400 text-xs mt-1">
              Add your first customer to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isCleared = c.balance <= 0;
            return (
              <Link
                key={c.id}
                href={`/${lang}/customers/${c.id}`}
                className="bg-white p-4 rounded-3xl flex items-center justify-between active:scale-[0.98] transition-all border border-zinc-200/80 hover:border-zinc-300 block shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg ${isCleared ? "bg-[#a3e635]/20 text-[#365314]" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-[#18181b] text-base">{c.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium">{c.phone ?? "No phone"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg ${isCleared ? "text-emerald-700" : "text-rose-600"}`}>
                    {c.balance.toLocaleString()}{" "}
                    <span className="text-[10px] opacity-60">FCFA</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-tighter font-bold flex items-center justify-end gap-1 ${isCleared ? "text-emerald-700" : "text-rose-600"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isCleared ? "bg-emerald-500" : "bg-rose-500"}`} />
                    {isCleared ? "Cleared" : "Unpaid"}
                    {c.isPending && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 font-extrabold text-[9px] lowercase border border-amber-200">
                        ⏳ pending sync
                      </span>
                    )}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
