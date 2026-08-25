"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/app/actions/orders";
import { queueOfflineTransaction } from "@/app/lib/syncEngine";
import type { Dictionary } from "@/app/lib/i18n";

type Customer = { id: string; name: string; phone: string | null; balance: number };
type StockItemPack = { id: string; name: string; size: number };
type StockItem = {
  id: string;
  name: string;
  unit: string;
  sell_price: number;
  quantity: number;
  stock_item_packs?: StockItemPack[];
};

type Line = {
  line_id: string; // unique identifier per cart entry (item + pack combination)
  stock_item_id: string;
  name: string;
  unit: string;
  quantity: number; // count of units or packs selected
  unit_price: number; // base unit sell price
  custom_unit_price?: number; // custom overridden base unit price
  pack_name?: string;
  pack_size?: number; // size if pack (e.g. 24)
};

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

  // Modal state for selecting Unit vs Pack when an item has packs
  const [packModalItem, setPackModalItem] = useState<StockItem | null>(null);

  // State for inline price editing in cart lines
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editingPriceInput, setEditingPriceInput] = useState<string>("");

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase().trim())
  );

  const filteredItems = stockItems.filter((i) =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase().trim())
  );

  const getEffectiveUnitPrice = (l: Line) => l.custom_unit_price ?? l.unit_price;

  const getEffectivePricePerSellingUnit = (l: Line) =>
    getEffectiveUnitPrice(l) * (l.pack_size ?? 1);

  const getLineTotal = (l: Line) => l.quantity * getEffectivePricePerSellingUnit(l);

  // Total cart amount (considering base units vs pack prices & custom price overrides)
  const total = useMemo(
    () => lines.reduce((sum, l) => sum + getLineTotal(l), 0),
    [lines]
  );

  function startPriceEdit(l: Line) {
    setEditingLineId(l.line_id);
    setEditingPriceInput(getEffectivePricePerSellingUnit(l).toString());
  }

  function savePriceEdit(l: Line) {
    const num = parseFloat(editingPriceInput);
    if (!isNaN(num) && num >= 0) {
      const packSize = l.pack_size ?? 1;
      const newCustomUnitPrice = num / packSize;
      setLines((prev) =>
        prev.map((item) =>
          item.line_id === l.line_id
            ? { ...item, custom_unit_price: newCustomUnitPrice }
            : item
        )
      );
    }
    setEditingLineId(null);
  }

  function resetPriceToDefault(lineId: string) {
    setLines((prev) =>
      prev.map((item) =>
        item.line_id === lineId ? { ...item, custom_unit_price: undefined } : item
      )
    );
  }

  function addSingleUnitLine(item: StockItem) {
    const lineId = `${item.id}_unit`;
    setLines((prev) => {
      const existing = prev.find((l) => l.line_id === lineId);
      if (existing) {
        return prev.map((l) =>
          l.line_id === lineId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          line_id: lineId,
          stock_item_id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: 1,
          unit_price: item.sell_price,
        },
      ];
    });
  }

  function addPackLine(item: StockItem, pack: StockItemPack) {
    const lineId = `${item.id}_pack_${pack.id}`;
    setLines((prev) => {
      const existing = prev.find((l) => l.line_id === lineId);
      if (existing) {
        return prev.map((l) =>
          l.line_id === lineId ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [
        ...prev,
        {
          line_id: lineId,
          stock_item_id: item.id,
          name: item.name,
          unit: item.unit,
          quantity: 1,
          unit_price: item.sell_price,
          pack_name: pack.name,
          pack_size: pack.size,
        },
      ];
    });
  }

  function handleItemClick(item: StockItem) {
    if (item.stock_item_packs && item.stock_item_packs.length > 0) {
      setPackModalItem(item);
    } else {
      addSingleUnitLine(item);
    }
  }

  function updateLineQty(lineId: string, qty: number) {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.line_id !== lineId)
        : prev.map((l) => (l.line_id === lineId ? { ...l, quantity: qty } : l))
    );
  }

  // Serialize line items for backend processing (deducting base unit quantities and custom prices)
  const itemsJson = JSON.stringify(
    lines.map((l) => ({
      stock_item_id: l.stock_item_id,
      quantity: l.quantity * (l.pack_size ?? 1),
      unit_price: getEffectiveUnitPrice(l),
    }))
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
          quantity: l.quantity * (l.pack_size ?? 1),
          unit_price: getEffectiveUnitPrice(l),
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

          <div className="max-h-48 overflow-y-auto flex flex-wrap gap-2">
            {filteredItems.map((item) => {
              const isOut = item.quantity <= 0;
              const hasPacks = item.stock_item_packs && item.stock_item_packs.length > 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={isOut}
                  onClick={() => handleItemClick(item)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isOut
                      ? "bg-zinc-100 text-zinc-300 cursor-not-allowed"
                      : "bg-zinc-100 text-zinc-700 hover:bg-[#18181b] hover:text-[#a3e635] active:scale-95"
                  }`}
                >
                  <span>{item.name}</span>
                  {hasPacks && (
                    <span className="bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 rounded text-[9px] font-black uppercase">
                      Packs
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 font-medium">({item.quantity} {item.unit})</span>
                  {isOut && <span className="text-[9px] text-rose-500 font-bold">({t.outOfStockBadge})</span>}
                </button>
              );
            })}
          </div>

          {/* Order lines */}
          {lines.length === 0 ? (
            <p className="text-zinc-400 text-sm text-center py-4">{t.noItemsAdded}</p>
          ) : (
            <div className="space-y-2.5 pt-2">
              {lines.map((line) => {
                const unitPriceForLine = getEffectivePricePerSellingUnit(line);
                const lineTotal = getLineTotal(line);
                const isEditing = editingLineId === line.line_id;

                return (
                  <div
                    key={line.line_id}
                    className="bg-zinc-50 rounded-2xl p-3.5 border border-zinc-200/80 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3 transition-all"
                  >
                    {/* Item Name, Badges & Interactive Price Editor */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#18181b] text-sm truncate">{line.name}</p>
                        {line.pack_name && (
                          <span className="bg-amber-100 text-amber-900 font-black text-[9px] px-2 py-0.5 rounded-full border border-amber-200 uppercase shrink-0">
                            {line.pack_name} ({line.pack_size} {line.unit})
                          </span>
                        )}
                        {line.custom_unit_price != null && (
                          <span className="bg-emerald-100 text-emerald-800 font-black text-[9px] px-2 py-0.5 rounded-full border border-emerald-200 uppercase shrink-0 flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[10px]">edit</span>
                            Custom Price
                          </span>
                        )}
                      </div>

                      {/* Price Display or Inline Editor */}
                      <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border-2 border-[#18181b] shadow-sm">
                            <input
                              type="number"
                              autoFocus
                              min="0"
                              step="any"
                              value={editingPriceInput}
                              onChange={(e) => setEditingPriceInput(e.target.value)}
                              className="w-24 px-2 py-1 bg-zinc-50 rounded-lg text-xs font-black text-[#18181b] border-none focus:ring-0"
                              placeholder="Price"
                            />
                            <span className="text-[10px] font-bold text-zinc-500">FCFA</span>
                            <button
                              type="button"
                              onClick={() => savePriceEdit(line)}
                              className="px-2 py-1 bg-[#18181b] text-[#a3e635] rounded-lg font-black text-[10px] hover:bg-zinc-800 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingLineId(null)}
                              className="px-1.5 py-1 text-zinc-400 hover:text-zinc-600 font-bold text-[10px] cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => startPriceEdit(line)}
                              className="group flex items-center gap-1 text-zinc-500 hover:text-[#18181b] transition-colors cursor-pointer"
                              title="Tap to edit selling price"
                            >
                              <span className="font-semibold text-zinc-600 group-hover:text-[#18181b]">
                                {unitPriceForLine.toLocaleString()} FCFA / {line.pack_name ?? line.unit}
                              </span>
                              <span className="material-symbols-outlined text-xs text-zinc-400 group-hover:text-[#18181b]">
                                edit
                              </span>
                            </button>

                            {line.custom_unit_price != null && (
                              <button
                                type="button"
                                onClick={() => resetPriceToDefault(line.line_id)}
                                className="text-[10px] text-zinc-400 hover:text-rose-600 underline font-medium cursor-pointer"
                                title="Reset to standard price"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Controls: Subtotal & Quantity Stepper */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t border-zinc-100 sm:border-t-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[9px] uppercase font-bold text-zinc-400 sm:hidden">Subtotal</p>
                        <p className="font-black text-[#18181b] text-xs sm:text-sm">{lineTotal.toLocaleString()} FCFA</p>
                      </div>

                      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-zinc-200 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateLineQty(line.line_id, line.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-95 transition-all text-sm cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-7 text-center font-black text-[#18181b] text-xs">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateLineQty(line.line_id, line.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold flex items-center justify-center active:scale-95 transition-all text-sm cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      {/* Modal for selecting Unit vs Pack when an item has configured packs */}
      {packModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
              <div>
                <h3 className="font-extrabold text-[#18181b] text-base">{packModalItem.name}</h3>
                <p className="text-xs text-zinc-400">{t.selectUnitOrPack ?? "Select Selling Unit / Pack"}</p>
              </div>
              <button
                type="button"
                onClick={() => setPackModalItem(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Option 1: Single Unit */}
              <button
                type="button"
                onClick={() => {
                  addSingleUnitLine(packModalItem);
                  setPackModalItem(null);
                }}
                className="w-full p-4 rounded-2xl border-2 border-zinc-200 hover:border-[#18181b] bg-zinc-50 hover:bg-zinc-100 text-left transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-bold text-[#18181b] text-sm">{t.sellByUnit ?? "Single Unit"}</p>
                  <p className="text-xs text-zinc-500">1 {packModalItem.unit}</p>
                </div>
                <span className="font-black text-emerald-600 text-sm">
                  {packModalItem.sell_price.toLocaleString()} FCFA
                </span>
              </button>

              {/* Option 2+: Configured Packs */}
              {packModalItem.stock_item_packs?.map((p) => {
                const packPrice = p.size * packModalItem.sell_price;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      addPackLine(packModalItem, p);
                      setPackModalItem(null);
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-amber-200 hover:border-amber-500 bg-amber-50/60 hover:bg-amber-100/80 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-amber-700 text-base">inventory_2</span>
                        <p className="font-extrabold text-amber-950 text-sm">{p.name}</p>
                      </div>
                      <p className="text-xs text-amber-800 font-medium">{p.size} {packModalItem.unit}s per {p.name}</p>
                    </div>
                    <span className="font-black text-amber-950 text-sm">
                      {packPrice.toLocaleString()} FCFA
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
