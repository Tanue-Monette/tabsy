"use client";

import { useEffect, useState } from "react";

type Props = {
  capitalLabel: string;
  capitalValue: number;
  salesMonthLabel?: string;
  salesMonthValue?: number;
  profitLabel: string;
  profitValue: number;
  currency?: string;
};

const STORAGE_KEY = "tabsy_amounts_masked";

export default function StockValueCards({
  capitalLabel,
  capitalValue,
  salesMonthLabel = "Sales This Month",
  salesMonthValue,
  profitLabel,
  profitValue,
  currency = "FCFA",
}: Props) {
  const [masked, setMasked] = useState(false);

  useEffect(() => {
    try {
      setMasked(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable — default to visible
    }
  }, []);

  function toggle() {
    setMasked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore write failures
      }
      return next;
    });
  }

  const display = (amount: number) => (masked ? "••••••" : amount.toLocaleString());

  const hasSales = salesMonthValue !== undefined;

  return (
    <div className={`grid ${hasSales ? "grid-cols-3" : "grid-cols-2"} gap-3`}>
      {/* 1. Total Stock Asset Value */}
      <section className="bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#18181b] rounded-3xl p-4 sm:p-5 shadow-xl ring-1 ring-white/10 relative overflow-hidden text-white flex flex-col justify-between">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-1">
          <p className="text-white/60 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider leading-tight">
            {capitalLabel}
          </p>
          <button
            type="button"
            onClick={toggle}
            className="text-white/40 hover:text-white/80 shrink-0 -mt-0.5"
            aria-label={masked ? "Show amount" : "Hide amount"}
          >
            <span className="material-symbols-outlined text-sm sm:text-base">
              {masked ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <div className="relative z-10 mt-3 flex items-baseline gap-1 flex-wrap">
          <span className="text-lg sm:text-2xl font-black text-white leading-none">
            {display(capitalValue)}
          </span>
          {!masked && <span className="text-[9px] sm:text-[10px] font-extrabold text-[#a3e635]">{currency}</span>}
        </div>
      </section>

      {/* 2. Total Sales Month (If provided) */}
      {hasSales && (
        <section className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 rounded-3xl p-4 sm:p-5 shadow-xl ring-1 ring-white/10 relative overflow-hidden text-white flex flex-col justify-between">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-1">
            <p className="text-white/60 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider leading-tight">
              {salesMonthLabel}
            </p>
            <button
              type="button"
              onClick={toggle}
              className="text-white/40 hover:text-white/80 shrink-0 -mt-0.5"
              aria-label={masked ? "Show amount" : "Hide amount"}
            >
              <span className="material-symbols-outlined text-sm sm:text-base">
                {masked ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
          <div className="relative z-10 mt-3 flex items-baseline gap-1 flex-wrap">
            <span className="text-lg sm:text-2xl font-black text-white leading-none">
              {display(salesMonthValue)}
            </span>
            {!masked && <span className="text-[9px] sm:text-[10px] font-extrabold text-blue-300">{currency}</span>}
          </div>
        </section>
      )}

      {/* 3. Benefit of the Month (Profit) */}
      <section className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 rounded-3xl p-4 sm:p-5 shadow-xl ring-1 ring-white/10 relative overflow-hidden text-white flex flex-col justify-between">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between gap-1">
          <p className="text-white/60 font-semibold text-[9px] sm:text-[10px] uppercase tracking-wider leading-tight">
            {profitLabel}
          </p>
          <button
            type="button"
            onClick={toggle}
            className="text-white/40 hover:text-white/80 shrink-0 -mt-0.5"
            aria-label={masked ? "Show amount" : "Hide amount"}
          >
            <span className="material-symbols-outlined text-sm sm:text-base">
              {masked ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
        <div className="relative z-10 mt-3 flex items-baseline gap-1 flex-wrap">
          <span className="text-lg sm:text-2xl font-black text-white leading-none">
            {display(profitValue)}
          </span>
          {!masked && <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-300">{currency}</span>}
        </div>
      </section>
    </div>
  );
}

