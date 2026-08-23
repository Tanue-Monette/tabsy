"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
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
  const [state, action, pending] = useActionState(createOrder, undefined);

  const [saleType, setSaleType] = useState<"sale" | "debt">("sale");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mtn" | "orange">("cash");
  const [customerId, setCustomerId] = useState(preselectedCustomerId ?? "");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

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

  const isValid =
    lines.length > 0 &&
    (saleType === "sale" || customerId.length > 0 || (showNewCustomer && newCustomerName.trim().length > 0));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!navigator.onLine) {
      e.preventDefault();
      if (!isValid) return;

      if (saleType === "debt" && !customerId && showNewCustomer) {
        setClientError("Adding a new customer requires an internet connection. Please pick an existing customer, or try again once you're back online.");
        return;
      }

      setClientError(null);
      await queueOfflineTransaction("order", {
        customer_id: customerId || undefined,
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
        router.push(`/${lang}/transactions`);
      }, 1500);
    }
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="flex-grow flex flex-col">
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="new_customer_name" value={showNewCustomer ? newCustomerName : ""} />
      <input type="hidden" name="new_customer_phone" value={showNewCustomer ? newCustomerPhone : ""} />
      <input type="hidden" name="sale_type" value={saleType} />
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <input type="hidden" name="items" value={itemsJson} />

      <main className="flex-grow px-6 pt-4 pb-4 space-y-4">
        {/* Settlement Type Toggle */}
        <div className="bg-zinc-200/80 p-1.5 rounded-3xl flex gap-1 border border-zinc-300/50">
          <button
            type="button"
            onClick={() => setSaleType("sale")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              saleType === "sale"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span className="material-symbols-outlined text-base">point_of_sale</span>
            Direct Sale (Paid)
          </button>

          <button
            type="button"
            onClick={() => setSaleType("debt")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              saleType === "debt"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <span className="material-symbols-outlined text-base">receipt_long</span>
            Credit / Debt Tab
          </button>
        </div>

        {/* Payment Method Selector for Direct Sales */}
        {saleType === "sale" && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "cash", label: "Cash", icon: "payments" },
                { key: "mtn", label: "MTN MoMo", icon: "smartphone" },
                { key: "orange", label: "Orange", icon: "account_balance_wallet" },
              ].map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key as any)}
                  className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                    paymentMethod === m.key
                      ? "border-[#18181b] bg-zinc-100 text-[#18181b] font-black"
                      : "border-zinc-100 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 font-bold"
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{m.icon}</span>
                  <span className="text-[11px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Customer picker (Required for Debt Sales ONLY) */}
        {saleType === "debt" && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
                {t.selectCustomer} <span className="text-rose-500">*</span>
              </label>
            </div>

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
            ) : showNewCustomer ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold text-zinc-500">{t.newCustomerName}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCustomer(false);
                      setNewCustomerName("");
                      setNewCustomerPhone("");
                    }}
                    className="text-zinc-400 hover:text-zinc-600 text-xs font-bold"
                  >
                    {t.cancel}
                  </button>
                </div>
                <input
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder={t.customerNamePlaceholder}
                  autoFocus
                  className="w-full h-12 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
                />
                <input
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder={t.customerPhoneOptional}
                  type="tel"
                  className="w-full h-12 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
                />
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
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCustomer(true);
                    setNewCustomerName(customerSearch);
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-dashed border-zinc-300 hover:bg-zinc-50 text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-[#a3e635]/20 text-[#365314] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-lg">person_add</span>
                  </div>
                  <p className="font-bold text-[#18181b] text-sm">
                    {t.addNewCustomer}
                    {customerSearch && <span className="text-zinc-400 font-medium"> "{customerSearch}"</span>}
                  </p>
                </button>
              </>
            )}
          </div>
        )}

        {/* Item picker */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-3">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">{t.items}</label>

          <input
            value={itemSearch}
            onChange={(e) => setItemSearch(e.target.value)}
            placeholder={t.searchItemPlaceholder}
            className="w-full h-12 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium"
          />

          <div className="max-h-44 overflow-y-auto flex flex-wrap gap-2">
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
                  <span className="ml-1 text-[10px] text-zinc-400 font-medium">({item.quantity} {item.unit})</span>
                  {isOut && <span className="ml-1 text-[9px] text-rose-500 font-bold">({t.outOfStockBadge})</span>}
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
          <p className="text-xs text-zinc-600 leading-relaxed font-medium">
            {saleType === "sale"
              ? "This will deduct stock and record a completed sale immediately."
              : "This will deduct stock and add the total to the customer's debt tab."}
          </p>
        </div>

        {clientError && (
          <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
            {clientError}
          </p>
        )}

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
          <span className="material-symbols-outlined text-[#a3e635]">
            {saleType === "sale" ? "shopping_cart" : "receipt_long"}
          </span>
          {pending
            ? t.registering
            : saleType === "sale"
            ? "Complete Direct Sale"
            : "Save as Customer Debt"}
        </button>
      </footer>
    </form>
  );
}
