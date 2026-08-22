"use client";

import { useState } from "react";
import Link from "next/link";
import { updateMerchantStatus, deleteMerchant } from "@/app/actions/admin/merchants";

export default function MerchantActions({
  merchantId,
  currentStatus
}: {
  merchantId: string;
  currentStatus: "active" | "suspended";
}) {
  const [isUpdating, setIsUpdating] = useState(false);

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

  return (
    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <Link
        href={`/admin/merchants/${merchantId}`}
        className="w-8 h-8 rounded-lg bg-white border border-zinc-200 text-zinc-600 flex items-center justify-center hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        title="View Details"
      >
        <span className="material-symbols-outlined text-[18px]">visibility</span>
      </Link>

      <button
        onClick={handleToggleStatus}
        disabled={isUpdating}
        className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors disabled:opacity-50 ${currentStatus === "active"
            ? "bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
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
  );
}
