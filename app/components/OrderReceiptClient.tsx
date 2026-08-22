"use client";

import { useActionState, useState } from "react";
import type { OrderDetail } from "@/app/actions/orders";
import { setOrderAsDebt } from "@/app/actions/orders";
import type { Dictionary } from "@/app/lib/i18n";

type Customer = { id: string; name: string; phone: string | null; balance: number };

type Props = {
  order: OrderDetail;
  customers: Customer[];
  merchantName?: string;
  shopName?: string;
  t: Dictionary["orders"];
};

const PAYMENT_LABEL: Record<string, string> = {
  cash: "Cash",
  mtn: "MTN MoMo",
  orange: "Orange Money",
  credit: "Debt",
};

export default function OrderReceiptClient({ order, customers, merchantName, shopName, t }: Props) {
  const [state, action, pending] = useActionState(setOrderAsDebt, undefined);
  const [showDebtForm, setShowDebtForm] = useState(false);
  const [customerId, setCustomerId] = useState(order.customer?.id ?? "");
  const [customerSearch, setCustomerSearch] = useState("");

  const date = new Date(order.created_at);
  const selectedCustomer = customers.find((c) => c.id === customerId);
  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase().trim())
  );

  const isDebt = order.payment_type === "credit";

  return (
    <div className="space-y-4">
      {/* Receipt card — this is the printable area */}
      <div id="receipt" className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-6 print:shadow-none print:border-none">
        <div className="text-center pb-4 border-b border-dashed border-zinc-200">
          <h2 className="font-black text-lg text-[#18181b]">{shopName ?? "Tabsy"}</h2>
          {merchantName && <p className="text-zinc-400 text-xs">{merchantName}</p>}
          <p className="text-zinc-400 text-[11px] mt-2">
            {date.toLocaleDateString()} · {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-zinc-300 text-[10px] mt-1 font-mono">#{order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <div className="py-4 border-b border-dashed border-zinc-200">
          <p className="text-xs text-zinc-500">
            {t.customer}: <span className="font-bold text-[#18181b]">{order.customer?.name ?? t.walkIn}</span>
          </p>
          {order.customer?.phone && <p className="text-xs text-zinc-400">{order.customer.phone}</p>}
        </div>

        <div className="py-4 space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="min-w-0 pr-2">
                <p className="font-semibold text-[#18181b] truncate">{item.name}</p>
                <p className="text-zinc-400 text-xs">
                  {item.quantity} {item.unit} × {item.unit_price.toLocaleString()}
                </p>
              </div>
              <span className="font-bold text-[#18181b] shrink-0">
                {(item.quantity * item.unit_price).toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-dashed border-zinc-200 flex items-center justify-between">
          <span className="font-black text-[#18181b]">{t.total}</span>
          <span className="font-black text-xl text-[#18181b]">{order.total_amount.toLocaleString()} FCFA</span>
        </div>

        <div className="pt-3 text-center">
          <span
            className={`text-[10px] uppercase tracking-tight font-bold px-3 py-1 rounded-lg border ${
              isDebt
                ? "text-rose-600 bg-rose-50 border-rose-100"
                : "text-emerald-700 bg-emerald-50 border-emerald-100"
            }`}
          >
            {PAYMENT_LABEL[order.payment_type] ?? order.payment_type}
          </span>
        </div>
      </div>

      {/* Actions — hidden when printing */}
      <div className="flex gap-3 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 bg-[#18181b] hover:bg-[#27272a] text-white py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all"
        >
          <span className="material-symbols-outlined text-[#a3e635] text-lg">print</span>
          {t.printReceipt}
        </button>

        {!isDebt && !showDebtForm && (
          <button
            type="button"
            onClick={() => setShowDebtForm(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-[#18181b] py-3.5 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all border border-zinc-200/80"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            {t.markAsDebt}
          </button>
        )}
      </div>

      {/* Mark as debt form */}
      {!isDebt && showDebtForm && (
        <form action={action} className="bg-white rounded-3xl border border-zinc-200/80 shadow-sm p-5 space-y-3 print:hidden">
          <input type="hidden" name="order_id" value={order.id} />
          <input type="hidden" name="customer_id" value={customerId} />

          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider">
            {t.selectCustomerForDebt}
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
              <button type="button" onClick={() => setCustomerId("")} className="text-zinc-400 hover:text-zinc-600">
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

          {state?.message && (
            <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl">
              {state.message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !customerId}
            className="w-full py-3.5 bg-[#18181b] hover:bg-[#27272a] text-white rounded-2xl font-bold text-sm active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? t.saving : t.confirmMarkAsDebt}
          </button>
        </form>
      )}
    </div>
  );
}
