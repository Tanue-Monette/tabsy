"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAsDebt } from "@/app/actions/orders";
import { queueOfflineTransaction } from "@/app/lib/syncEngine";
import type { Dictionary } from "@/app/lib/i18n";

type Customer = { id: string; name: string; phone: string | null; balance: number };
type StockItem = { id: string; name: string; unit: string; sell_price: number; quantity: number };
type Line = { stock_item_id: string; name: string; unit: string; quantity: number; unit_price: number };

type Props = {
  customers: Customer[];
  stockItems: StockItem[];
  t: Dictionary["order"];
  lang: string;
  preselectedCustomerId?: string;
};

export default function NewOrderForm({ customers, stockItems, t, lang, preselectedCustomerId }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createOrderAsDebt, undefined);

  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase().trim())
  );

  const filteredItems = stockItems.filter((i) =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase().trim())
  );

  const total = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0),
    [lines]
  );

  function addItem(item: StockItem) {
    setLines((prev) => {
      const existing = prev.find((l) => l.stock_item_id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.stock_item_id === item.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { stock_item_id: item.id, name: item.name, unit: item.unit, quantity: 1, unit_price: item.sell_price }];
    });
  }

  function updateQty(id: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.stock_item_id !== id)
        : prev.map((l) => (l.stock_item_id === id ? { ...l, quantity: qty } : l))
    );
  }

  const itemsJson = JSON.stringify(
    lines.map((l) => ({ stock_item_id: l.stock_item_id, quantity: l.quantity, unit_price: l.unit_price }))
  );

  const isValid = customerId.length > 0 && lines.length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      if (!isValid) return;

      await queueOfflineTransaction("order", {
        customer_id: customerId,
        amount: total,
        items: lines.map((l) => ({
          stock_item_id: l.stock_item_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          name: l.name,
        })),
      });

      setOfflineMessage("Saved offline! Order queued to sync when internet returns.");
      setTimeout(() => {
        router.push(`/${lang}/customers/${customerId}`);
      }, 1500);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex-grow flex flex-col">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="items" value={itemsJson} />

      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        {/* Customer picker */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {t.selectCustomer}
          </label>

          {selectedCustomer ? (
            <div className="flex items-center justify-between bg-zinc-100 rounded-2xl p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#18181b] text-[#a3e635] flex items-center justify-center font-black">
                  {selectedCustomer.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-[#18181b] text-sm">{selectedCustomer.name}</p>
                  <p className="text-zinc-500 text-xs">{selectedCustomer.phone ?? "No phone"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomerId("")}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          ) : (
            <>
              <input
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={t.searchCustomerPlaceholder}
                className="w-full h-12 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
              />
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredCustomers.slice(0, 8).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCustomerId(c.id);
                      setCustomerSearch("");
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-100 text-left"
                  >
                    <div className="h-9 w-9 rounded-lg bg-zinc-200 text-zinc-600 flex items-center justify-center font-bold text-sm">
                      {c.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#18181b] text-sm truncate">{c.name}</p>
                      <p className="text-zinc-400 text-xs">{c.phone ?? "No phone"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Item picker */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.items}</label>

          <input
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder={t.searchItemPlaceholder}
            className="w-full h-12 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
          />

          <div className="max-h-40 overflow-y-auto flex flex-wrap gap-2">
            {filteredItems.map((item) => {
              const isOut = item.quantity <= 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => addItem(item)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                    isOut
                      ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                      : "bg-zinc-100 text-zinc-700 hover:bg-[#18181b] hover:text-[#a3e635]"
                  }`}
                >
                  {item.name}
                  {isOut && <span className="ml-1 text-[9px]">({t.outOfStockBadge})</span>}
                </button>
              );
            })}
          </div>

          {/* Order lines */}
          {lines.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-4">{t.noItemsAdded}</p>
          ) : (
            <div className="space-y-2 pt-2">
              {lines.map((line) => (
                <div key={line.stock_item_id} className="flex items-center justify-between bg-zinc-50 rounded-2xl p-3 border border-zinc-100">
                  <div className="min-w-0">
                    <p className="font-bold text-[#18181b] text-sm truncate">{line.name}</p>
                    <p className="text-zinc-400 text-xs">
                      {line.unit_price.toLocaleString()} FCFA / {line.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQty(line.stock_item_id, line.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-95"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-black text-[#18181b]">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(line.stock_item_id, line.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-[#18181b] via-[#27272a] to-[#18181b] rounded-3xl p-6 shadow-xl ring-1 ring-white/10 text-white">
          <p className="text-white/60 font-semibold text-xs uppercase tracking-wider mb-2">{t.orderTotal}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black leading-none">{total.toLocaleString()}</span>
            <span className="text-lg font-extrabold text-[#a3e635]">FCFA</span>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-zinc-100 border border-zinc-200/80 rounded-2xl">
          <span className="material-symbols-outlined text-[#18181b]">info</span>
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">{t.infoOrder}</p>
        </div>

        {offlineMessage && (
          <p className="text-[#18181b] font-bold text-sm text-center bg-[#a3e635]/20 border border-[#a3e635] px-4 py-3 rounded-2xl">
            {offlineMessage}
          </p>
        )}

        {state?.message && (
          <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
            {state.message}
          </p>
        )}
      </main>

      <footer className="p-6 bg-white border-t border-zinc-100">
        <button
          type="submit"
          disabled={pending || !isValid}
          className="w-full py-4 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-extrabold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[#a3e635]">receipt_long</span>
          {pending ? t.registering : t.registerOrder}
        </button>
      </footer>
    </form>
  );
}
