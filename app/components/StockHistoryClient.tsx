"use client";

import { useMemo, useState } from "react";
import type { Dictionary } from "@/app/lib/i18n";
import PaginationControls from "@/app/components/PaginationControls";

export type MovementRecord = {
  id: string;
  stock_item_id: string;
  movement_type: "restock" | "adjustment" | "sale";
  quantity_change: number;
  unit_cost: number | null;
  adjustment_reason: string | null;
  note: string | null;
  created_at: string;
  item_name: string;
  item_unit: string;
};

type Props = {
  movements: MovementRecord[];
  merchantName?: string;
  shopName?: string;
  t?: Dictionary["stockHistory"];
};

export default function StockHistoryClient({
  movements,
  merchantName,
  shopName,
  t,
}: Props) {
  const [filterType, setFilterType] = useState<"all" | "restock" | "adjustment" | "sale">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleFilterChange = (type: "all" | "restock" | "adjustment" | "sale") => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (s: string) => {
    setSearch(s);
    setCurrentPage(1);
  };

  const filteredMovements = useMemo(() => {
    const query = search.toLowerCase().trim();
    return movements.filter((m) => {
      const matchesType = filterType === "all" || m.movement_type === filterType;
      const matchesSearch =
        !query ||
        m.item_name.toLowerCase().includes(query) ||
        (m.note && m.note.toLowerCase().includes(query)) ||
        (m.adjustment_reason && m.adjustment_reason.toLowerCase().includes(query));

      return matchesType && matchesSearch;
    });
  }, [movements, filterType, search]);

  const totalRestockInvestment = useMemo(() => {
    return movements
      .filter((m) => m.movement_type === "restock" && m.unit_cost != null)
      .reduce((sum, m) => sum + m.quantity_change * (m.unit_cost ?? 0), 0);
  }, [movements]);

  const totalUnitsRestocked = useMemo(() => {
    return movements
      .filter((m) => m.movement_type === "restock")
      .reduce((sum, m) => sum + m.quantity_change, 0);
  }, [movements]);

  const totalAdjustmentsCount = useMemo(() => {
    return movements.filter((m) => m.movement_type === "adjustment").length;
  }, [movements]);

  const totalPages = Math.ceil(filteredMovements.length / pageSize);
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const exportPDF = () => {
    const originalTitle = document.title;
    document.title = `Stock_Movement_Report_${new Date().toISOString().slice(0, 10)}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getReasonLabel = (reason: string | null) => {
    if (!reason) return null;
    switch (reason) {
      case "recount":
        return t?.recount ?? "Recount";
      case "typo":
        return t?.typo ?? "Typo";
      case "spoilage":
        return t?.spoilage ?? "Spoilage";
      case "expiry":
        return t?.expiry ?? "Expired";
      case "damage":
        return t?.damage ?? "Damaged";
      case "theft":
        return t?.theft ?? "Theft / Loss";
      case "personal_use":
        return t?.personal_use ?? "Personal Use";
      default:
        return reason;
    }
  };

  return (
    <div className="space-y-6">
      {/* Global Print Styles */}
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

      {/* Filter Tabs & Search Bar */}
      <div className="no-print space-y-4">
        {/* Type Filter Tabs */}
        <div className="bg-zinc-200/80 p-1.5 rounded-3xl flex gap-1 border border-zinc-300/50">
          <button
            type="button"
            onClick={() => handleFilterChange("all")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === "all"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base">list_alt</span>
            {t?.allMovements ?? "All Movements"}
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange("restock")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === "restock"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base text-emerald-400">add_shopping_cart</span>
            {t?.restocksOnly ?? "Restocks"}
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange("adjustment")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === "adjustment"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base text-amber-400">tune</span>
            {t?.adjustmentsOnly ?? "Adjustments"}
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange("sale")}
            className={`flex-1 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterType === "sale"
                ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-300/50"
            }`}
          >
            <span className="material-symbols-outlined text-base text-blue-400">sell</span>
            {t?.salesOnly ?? "Sales"}
          </button>
        </div>

        {/* Search Input & Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3.5 top-3 text-zinc-400 text-lg">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t?.searchPlaceholder ?? "Search item name or notes..."}
              className="w-full h-11 pl-10 pr-4 bg-white border border-zinc-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-[#18181b] transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={exportPDF}
              disabled={filteredMovements.length === 0}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-zinc-200 hover:bg-zinc-50 rounded-2xl font-bold text-xs text-[#18181b] flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-rose-600 text-base">picture_as_pdf</span>
              {t?.exportPdf ?? "Export PDF"}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredMovements.length === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#18181b] text-white hover:bg-[#27272a] rounded-2xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[#a3e635] text-base">print</span>
              {t?.print ?? "Print"}
            </button>
          </div>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block border-b border-zinc-300 pb-4 mb-6">
        <h1 className="text-2xl font-black text-black">{shopName ?? "Tabsy POS"}</h1>
        <p className="text-sm font-bold text-zinc-700">
          {t?.title ?? "Restock & Stock Movement Report"}
        </p>
        <p className="text-xs text-zinc-500">
          Merchant: {merchantName ?? "Shop Merchant"} • Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {/* Total Restock Investment */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200/80">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
            <span className="material-symbols-outlined text-xl">payments</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {t?.totalInvestment ?? "Total Restock Investment"}
          </p>
          <div className="flex items-baseline gap-1">
            <h3 className="text-xl sm:text-2xl font-black text-[#18181b]">
              {totalRestockInvestment.toLocaleString()}
            </h3>
            <span className="text-xs font-bold text-zinc-400">FCFA</span>
          </div>
        </div>

        {/* Total Units Restocked */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200/80">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100">
            <span className="material-symbols-outlined text-xl">inventory_2</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {t?.unitsRestocked ?? "Total Restock Units"}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-[#18181b]">
            {totalUnitsRestocked.toLocaleString()}
          </h3>
        </div>

        {/* Adjustments Count */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border border-zinc-200/80">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 border border-amber-100">
            <span className="material-symbols-outlined text-xl">tune</span>
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
            {t?.adjustmentsLogged ?? "Adjustments Logged"}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-[#18181b]">
            {totalAdjustmentsCount.toLocaleString()}
          </h3>
        </div>
      </div>

      {/* Movement Audit Trail List / Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-zinc-200/80 print-container">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-[#18181b] text-base">
              {t?.title ?? "Restock & Movement Report"}
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              {t?.subtitle ?? "Audit trail of all inventory restocks, sales, and corrections"}
            </p>
          </div>
          <span className="text-xs font-black text-zinc-500 bg-zinc-100 px-3 py-1 rounded-full">
            {filteredMovements.length} {filteredMovements.length === 1 ? "record" : "records"}
          </span>
        </div>

        {filteredMovements.length === 0 ? (
          <div className="text-center py-12 px-4">
            <span className="material-symbols-outlined text-4xl text-zinc-300 mb-2">history</span>
            <p className="text-zinc-500 font-bold text-sm">
              {t?.noMovements ?? "No stock movements recorded yet."}
            </p>
            <p className="text-zinc-400 text-xs mt-1">
              {t?.movementsAppear ??
                "Stock restocks, sales, and adjustments will automatically appear here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-5">Date & Time</th>
                  <th className="py-3.5 px-5">Type</th>
                  <th className="py-3.5 px-5">Item</th>
                  <th className="py-3.5 px-5 text-right">Quantity Change</th>
                  <th className="py-3.5 px-5 text-right">Unit Cost</th>
                  <th className="py-3.5 px-5 text-right">Total Cost Value</th>
                  <th className="py-3.5 px-5">Reason / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {paginatedMovements.map((m) => {
                  const isRestock = m.movement_type === "restock";
                  const isAdjustment = m.movement_type === "adjustment";
                  const isSale = m.movement_type === "sale";
                  const totalCost =
                    isRestock && m.unit_cost != null
                      ? m.quantity_change * m.unit_cost
                      : null;

                  return (
                    <tr key={m.id} className="hover:bg-zinc-50/80 transition-colors">
                      {/* Date & Time */}
                      <td className="py-4 px-5 text-zinc-500 font-medium whitespace-nowrap">
                        {new Date(m.created_at).toLocaleString([], {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>

                      {/* Movement Type Badge */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        {isRestock && (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                            <span className="material-symbols-outlined text-xs">add_shopping_cart</span>
                            Restock
                          </span>
                        )}
                        {isAdjustment && (
                          <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                            <span className="material-symbols-outlined text-xs">tune</span>
                            Adjustment
                          </span>
                        )}
                        {isSale && (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                            <span className="material-symbols-outlined text-xs">point_of_sale</span>
                            Sale
                          </span>
                        )}
                      </td>

                      {/* Item Name & Unit */}
                      <td className="py-4 px-5 font-bold text-[#18181b]">
                        {m.item_name}
                      </td>

                      {/* Quantity Change */}
                      <td
                        className={`py-4 px-5 text-right font-black ${
                          m.quantity_change > 0
                            ? "text-emerald-600"
                            : m.quantity_change < 0
                            ? "text-rose-600"
                            : "text-zinc-600"
                        }`}
                      >
                        {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}{" "}
                        <span className="text-[10px] text-zinc-400 font-normal">{m.item_unit}</span>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-4 px-5 text-right font-semibold text-zinc-600">
                        {m.unit_cost != null ? `${m.unit_cost.toLocaleString()} FCFA` : "—"}
                      </td>

                      {/* Total Cost Value */}
                      <td className="py-4 px-5 text-right font-black text-[#18181b]">
                        {totalCost != null ? `${totalCost.toLocaleString()} FCFA` : "—"}
                      </td>

                      {/* Reason / Note */}
                      <td className="py-4 px-5 text-zinc-600 text-xs">
                        {m.adjustment_reason && (
                          <span className="inline-block bg-zinc-100 text-zinc-700 font-bold px-2 py-0.5 rounded-lg text-[10px] mr-1.5 border border-zinc-200">
                            {getReasonLabel(m.adjustment_reason)}
                          </span>
                        )}
                        {m.note ? (
                          <span className="italic text-zinc-500">"{m.note}"</span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-zinc-100 no-print">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredMovements.length}
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
