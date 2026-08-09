"use client";

import { useRef, useState } from "react";
import Link from "next/link";

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
  // useRef to hold the input DOM node — fully uncontrolled, no value prop
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = customers
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
      {/* Search — fully uncontrolled input, no value/onChange */}
      <div className="relative">
        <div className="absolute inset-0 left-4 flex items-center pointer-events-none text-[#727972]">
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
          className="w-full h-14 bg-[#e1e3e4] border-none rounded-xl pl-12 pr-10 focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all text-[#191c1d] placeholder:text-[#424843]"
          placeholder="Search customer"
          type="text"
        />
        {search && (
          <button
            type="button"
            onMouseDown={handleClear}
            onTouchEnd={handleClear}
            className="absolute inset-y-0 right-4 flex items-center justify-center w-10 text-[#727972]"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onMouseDown={() => setFilter(f.key)}
            onTouchEnd={(e) => { e.preventDefault(); setFilter(f.key); }}
            className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-[#183524] text-white"
                : "bg-[#e7e8e9] text-[#424843]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="flex justify-between items-center px-1">
        <h2 className="text-[#191c1d] font-bold text-lg">Customers</h2>
        <span className="text-[#424843] text-sm">
          {filtered.length} {filtered.length === 1 ? "result" : "results"}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl text-center">
          <span className="material-symbols-outlined text-4xl text-[#c2c8c1] mb-3 block">
            {search ? "search_off" : "group"}
          </span>
          <p className="text-[#424843] font-medium">
            {search ? `No results for "${search}"` : "No customers yet."}
          </p>
          {!search && (
            <p className="text-[#424843]/60 text-sm mt-1">
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
                className="bg-white p-4 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all border border-transparent hover:border-[#c2c8c1]/30 block"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-bold text-lg ${isCleared ? "bg-[#ffdbca] text-[#9bbca3]" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                    {c.name[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#191c1d]">{c.name}</h3>
                    <p className="text-[#424843] text-sm">{c.phone ?? "No phone"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-black text-lg ${isCleared ? "text-[#9bbca3]" : "text-[#ba1a1a]"}`}>
                    {c.balance.toLocaleString()}{" "}
                    <span className="text-[10px] opacity-60">FCFA</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-tighter font-bold flex items-center justify-end gap-1 ${isCleared ? "text-[#9bbca3]" : "text-[#ba1a1a]"}`}>
                    <span className={`w-1 h-1 rounded-full ${isCleared ? "bg-[#9bbca3]" : "bg-[#ba1a1a]"}`} />
                    {isCleared ? "Cleared" : "Unpaid"}
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
