"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createMerchantByAdmin } from "@/app/actions/admin/merchants";
import type { ActionState } from "@/app/lib/definitions";

export default function CreateMerchantPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    createMerchantByAdmin,
    undefined
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/merchants" className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Create New Merchant</h2>
          <p className="text-sm text-slate-500">Register a new shop on the platform.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <form action={formAction} className="p-8 space-y-6">
          {state?.message && (
            <div className={`p-4 rounded-xl text-sm font-medium border flex items-center gap-2 ${state.message.includes("successfully")
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-red-50 text-red-700 border-red-100"
              }`}>
              <span className="material-symbols-outlined">
                {state.message.includes("successfully") ? "check_circle" : "error"}
              </span>
              {state.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Shop Name</label>
              <input
                type="text"
                name="shop_name"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900"
                placeholder="e.g. Monette's Store"
              />
              {state?.errors?.shop_name && (
                <p className="text-xs text-red-500 font-medium">{state.errors.shop_name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Owner Name</label>
              <input
                type="text"
                name="merchant_name"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900"
                placeholder="e.g. John Doe"
              />
              {state?.errors?.merchant_name && (
                <p className="text-xs text-red-500 font-medium">{state.errors.merchant_name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Phone Number</label>
              <input
                type="tel"
                name="phone"
                required
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900"
                placeholder="6XXXXXXXX"
              />
              {state?.errors?.phone && (
                <p className="text-xs text-red-500 font-medium">{state.errors.phone[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Initial PIN (4 digits)</label>
              <input
                type="text"
                name="pin"
                required
                maxLength={4}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 font-mono tracking-widest"
                placeholder="1234"
              />
              {state?.errors?.pin && (
                <p className="text-xs text-red-500 font-medium">{state.errors.pin[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 block">Account Status</label>
              <select
                name="status"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-zinc-900 appearance-none"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span>
                  Creating...
                </>
              ) : (
                "Create Merchant"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
