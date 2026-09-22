"use client";

import { useState } from "react";
import Link from "next/link";
import { updateMerchantStatus, deleteMerchant, reinitializeMerchantAccount } from "@/app/actions/admin/merchants";

export default function MerchantActions({
  merchantId,
  shopName,
  currentStatus
}: {
  merchantId: string;
  shopName?: string;
  currentStatus: "active" | "suspended";
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  async function handleToggleStatus() {
    setIsUpdating(true);
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await updateMerchantStatus(merchantId, newStatus);
    } catch (e) {
      alert("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to permanently delete this merchant? This action cannot be undone.")) return;

    setIsUpdating(true);
    try {
      await deleteMerchant(merchantId);
    } catch (e) {
      alert("Failed to delete merchant. Only Super Admins can perform this action.");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReinitialize() {
    setIsUpdating(true);
    try {
      const res = await reinitializeMerchantAccount(merchantId);
      alert(res.message);
      setShowResetModal(false);
    } catch (e) {
      alert("Failed to reinitialize merchant account.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          href={`/admin/merchants/${merchantId}`}
          className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          title="View Details"
        >
          <span className="material-symbols-outlined text-[18px]">visibility</span>
        </Link>

        <button
          onClick={() => setShowResetModal(true)}
          disabled={isUpdating}
          className="w-8 h-8 rounded-lg bg-white border border-amber-200 text-amber-600 flex items-center justify-center hover:bg-amber-50 hover:border-amber-300 transition-colors disabled:opacity-50"
          title="Reinitialize / Reset Merchant Data"
        >
          <span className="material-symbols-outlined text-[18px]">restart_alt</span>
        </button>

        <button
          onClick={handleToggleStatus}
          disabled={isUpdating}
          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 ${currentStatus === "active"
              ? "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300"
              : "bg-white border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
            }`}
          title={currentStatus === "active" ? "Suspend Merchant" : "Activate Merchant"}
        >
          <span className="material-symbols-outlined text-[18px]">
            {currentStatus === "active" ? "block" : "check_circle"}
          </span>
        </button>

        <button
          onClick={handleDelete}
          disabled={isUpdating}
          className="w-8 h-8 rounded-lg bg-white border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
          title="Delete Merchant"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-zinc-100">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100 shrink-0">
                <span className="material-symbols-outlined text-xl">restart_alt</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Reinitialize Merchant Data</h3>
                {shopName && <p className="text-xs font-semibold text-slate-500">{shopName}</p>}
              </div>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/60 rounded-xl p-4 text-xs text-amber-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">warning</span>
                Complete Factory Reset
              </p>
              <p>
                This action will wipe all inventory items, sales orders, transactions, customer directories, and debt records for this shop.
              </p>
              <p className="font-semibold text-amber-950">
                The account login and shop profile will remain active, setting it back to a brand new clean state.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-zinc-100 text-xs text-slate-600 space-y-1 font-mono">
              <p>• Stock Items & Packs: Cleared</p>
              <p>• Stock Movement Ledger: Cleared</p>
              <p>• Orders & Sales History: Cleared</p>
              <p>• Customer Directory & Debts: Cleared</p>
              <p>• EOD Shift Registers & Analytics: Cleared</p>
              <p>• Audit Log Entry: Created in System Logs</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReinitialize}
                disabled={isUpdating}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-md shadow-amber-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isUpdating ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Reinitializing...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Yes, Reinitialize Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

