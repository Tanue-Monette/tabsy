"use client";

import { useMemo, useState } from "react";
import type { ItemSoldRecord, PaymentStatsReport } from "@/app/actions/orders";
import type { Dictionary } from "@/app/lib/i18n";
import PaginationControls from "@/app/components/PaginationControls";

type Props = {
  items: ItemSoldRecord[];
  paymentStats?: PaymentStatsReport;
  merchantName?: string;
  shopName?: string;
  t?: Dictionary["inventoryReport"];
};

export default function InventorySalesReportClient({ items, paymentStats, merchantName, shopName, t }: Props) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const handlePeriodChange = (p: "day" | "week" | "month") => {
    setPeriod(p);
    setCurrentPage(1);
  };

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setCurrentPage(1);
  };

  const filteredItems = useMemo(() => {
    return items
      .map((item) => {
        const qty =
          period === "day"
            ? item.quantityToday
            : period === "week"
            ? item.quantityWeek
            : item.quantityMonth;
        const rev =
          period === "day"
            ? item.revenueToday
            : period === "week"
            ? item.revenueWeek
            : item.revenueMonth;

        return {
          ...item,
          quantity: qty,
          revenue: rev,
        };
      })
      .filter((i) => i.quantity > 0 && i.name.toLowerCase().includes(search.toLowerCase().trim()))
      .sort((a, b) => b.revenue - a.revenue);
  }, [items, period, search]);

  const totalQuantity = useMemo(
    () => filteredItems.reduce((sum, i) => sum + i.quantity, 0),
    [filteredItems]
  );

  const totalRevenue = useMemo(
    () => filteredItems.reduce((sum, i) => sum + i.revenue, 0),
    [filteredItems]
  );

  const currentCash =
    period === "day"
      ? paymentStats?.cashToday ?? 0
      : period === "week"
      ? paymentStats?.cashWeek ?? 0
      : paymentStats?.cashMonth ?? 0;

  const currentMtn =
    period === "day"
      ? paymentStats?.mtnToday ?? 0
      : period === "week"
      ? paymentStats?.mtnWeek ?? 0
      : paymentStats?.mtnMonth ?? 0;

  const currentOrange =
    period === "day"
      ? paymentStats?.orangeToday ?? 0
      : period === "week"
      ? paymentStats?.orangeWeek ?? 0
      : paymentStats?.orangeMonth ?? 0;

  const currentPeriodTotal =
    period === "day"
      ? paymentStats?.salesToday ?? totalRevenue
      : period === "week"
      ? paymentStats?.salesWeek ?? totalRevenue
      : paymentStats?.salesMonth ?? totalRevenue;

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const paginatedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const periodLabel =
    period === "day"
      ? t?.salesToday ?? "Sales Today"
      : period === "week"
      ? t?.thisWeek ?? "This Week"
      : t?.thisMonth ?? "This Month";

  const exportPDF = () => {
    const originalTitle = document.title;
    document.title = `Inventory_Sales_Report_${period}_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print / PDF Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          header, nav, .no-print {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* Action Toolbar & Period Selector */}
      <div className="no-print space-y-4">
        {/* Period Tabs */}
        <div className="bg-zinc-200/80 p-1.5 rounded-3xl flex gap-1 border border-zinc-300/50">
          <button
            type="button"
            onClick={() => handlePeriodChange("day")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === "day"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base">today</span>
            {t?.salesToday ?? "Sales Today"}
          </button>

          <button
            type="button"
            onClick={() => handlePeriodChange("week")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === "week"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base">date_range</span>
            {t?.thisWeek ?? "This Week"}
          </button>

          <button
            type="button"
            onClick={() => handlePeriodChange("month")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              period === "month"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base">calendar_month</span>
            {t?.thisMonth ?? "This Month"}
          </button>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-zinc-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t?.searchPlaceholder ?? "Search sold items..."}
              className="w-full h-11 pl-10 pr-4 bg-white border border-zinc-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#18181b] transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportPDF}
              disabled={filteredItems.length === 0}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-bold text-xs text-[#18181b] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-rose-600 text-base">picture_as_pdf</span>
              {t?.exportPdf ?? "Export PDF"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredItems.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#18181b] text-white hover:bg-[#27272a] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[#a3e635] text-base">print</span>
              {t?.print ?? "Print"}
            </button>
          </div>
        </div>
      </div>

      {/* Print Header (Visible during Print only) */}
      <div className="hidden print:block border-b border-zinc-300 pb-4 mb-6">
        <h1 className="text-2xl font-black text-black">{shopName ?? "Tabsy POS"}</h1>
        <p className="text-sm font-bold text-zinc-700">{t?.title ?? "Inventory Items Sold Report"} - {periodLabel}</p>
        <p className="text-xs text-zinc-500">Merchant: {merchantName ?? "Shop Merchant"} • Date: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <span className="material-symbols-outlined text-xl">inventory</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {t?.totalItemsSold ?? "Total Items Sold"} ({periodLabel})
          </p>
          <h3 className="text-3xl font-black text-[#18181b]">{totalQuantity.toLocaleString()}</h3>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80">
          <div className="w-10 h-10 rounded-2xl bg-[#a3e635]/20 text-[#365314] flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-xl font-bold">payments</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {t?.totalRevenue ?? "Total Revenue"} ({periodLabel})
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-3xl font-black text-[#18181b]">{totalRevenue.toLocaleString()}</h3>
            <span className="text-xs font-bold text-zinc-400">FCFA</span>
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown Cards */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-700 text-lg">account_balance_wallet</span>
            <h3 className="text-xs font-extrabold text-[#18181b] uppercase tracking-wider">
              {t?.paymentBreakdownTitle ?? "Payment Method Breakdown"} ({periodLabel})
            </h3>
          </div>
          <span className="text-[10px] font-black text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
            {currentPeriodTotal.toLocaleString()} FCFA
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Cash */}
          <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-base">payments</span>
              </div>
              <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {currentPeriodTotal > 0 ? Math.round((currentCash / currentPeriodTotal) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500">{t?.cash ?? "Cash"}</p>
              <p className="text-lg font-black text-[#18181b] mt-0.5 leading-tight">
                {currentCash.toLocaleString()}
              </p>
              <span className="text-[10px] font-semibold text-zinc-400">FCFA</span>
            </div>
          </div>

          {/* MTN Mobile Money */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black text-xs shadow-sm">
                MTN
              </div>
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                {currentPeriodTotal > 0 ? Math.round((currentMtn / currentPeriodTotal) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">{t?.mtn ?? "MTN MoMo"}</p>
              <p className="text-lg font-black text-[#18181b] mt-0.5 leading-tight">
                {currentMtn.toLocaleString()}
              </p>
              <span className="text-[10px] font-semibold text-amber-700">FCFA</span>
            </div>
          </div>

          {/* Orange Money */}
          <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-200/60 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#FF6600] text-white flex items-center justify-center font-black text-xs shadow-sm">
                OM
              </div>
              <span className="text-[10px] font-black text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                {currentPeriodTotal > 0 ? Math.round((currentOrange / currentPeriodTotal) * 100) : 0}%
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900">{t?.orange ?? "Orange Money"}</p>
              <p className="text-lg font-black text-[#18181b] mt-0.5 leading-tight">
                {currentOrange.toLocaleString()}
              </p>
              <span className="text-[10px] font-semibold text-orange-700">FCFA</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Sold Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 print-container">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#18181b] text-base">{t?.itemsSoldList ?? "Items Sold List"} ({periodLabel})</h3>
            <p className="text-xs text-zinc-400 font-medium">{t?.rankedByRevenue ?? "Ranked by revenue generated"}</p>
          </div>
          <span className="text-xs font-black text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 px-4">
            <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">inventory_2</span>
            <p className="text-zinc-500 font-bold text-sm">{t?.noItemsSold ?? "No items sold for this period."}</p>
            <p className="text-zinc-400 text-xs mt-1">{t?.posSalesAppear ?? "Direct POS sales will automatically appear here."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">{t?.itemName ?? "Item Name"}</th>
                  <th className="py-3.5 px-5 text-center">{t?.unit ?? "Unit"}</th>
                  <th className="py-3.5 px-5 text-right">{t?.qtySold ?? "Qty Sold"}</th>
                  <th className="py-3.5 px-5 text-right">{t?.revenue ?? "Revenue (FCFA)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedItems.map((item) => (
                  <tr key={item.stock_item_id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-[#18181b]">{item.name}</td>
                    <td className="py-4 px-5 text-center text-zinc-500 font-medium">{item.unit}</td>
                    <td className="py-4 px-5 text-right font-black text-[#18181b]">{item.quantity}</td>
                    <td className="py-4 px-5 text-right font-black text-emerald-600">
                      {item.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-zinc-100/80 font-black text-[#18181b] border-t-2 border-zinc-200">
                  <td colSpan={2} className="py-4 px-5 text-left uppercase text-[10px] tracking-wider text-zinc-500">
                    {t?.total ?? "Total"}
                  </td>
                  <td className="py-4 px-5 text-right font-black text-sm">{totalQuantity.toLocaleString()}</td>
                  <td className="py-4 px-5 text-right font-black text-base text-emerald-700">
                    {totalRevenue.toLocaleString()} FCFA
                  </td>
                </tr>
              </tfoot>
            </table>

            <div className="p-4 border-t border-zinc-100 no-print">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
