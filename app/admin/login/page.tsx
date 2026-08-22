"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions/admin/auth";
import type { ActionState } from "@/app/lib/definitions";

export default function AdminLoginPage() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    adminLogin,
    undefined
  );

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-zinc-100">
        <div className="p-8 bg-slate-900 text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <span className="material-symbols-outlined text-white text-3xl">shield_person</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-400 text-sm">Sign in to manage the Tabsy platform</p>
        </div>
        
        <form action={formAction} className="p-8 space-y-6">
          {state?.message && (
            <div className="p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100 flex items-center gap-2">
              <span className="material-symbols-outlined">error</span>
              {state.message}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 block">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-zinc-400">mail</span>
              </div>
              <input
                type="email"
                name="email"
                defaultValue="admin@tabsy.com"
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-zinc-900"
                placeholder="admin@tabsy.com"
              />
            </div>
            {state?.errors?.email && (
              <p className="text-xs text-red-500 font-medium pl-1">{state.errors.email[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-700 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-zinc-400">lock</span>
              </div>
              <input
                type="password"
                name="password"
                defaultValue="AdminPass123!"
                required
                className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-zinc-900"
                placeholder="Enter password"
              />
            </div>
            {state?.errors?.password && (
              <p className="text-xs text-red-500 font-medium pl-1">{state.errors.password[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex justify-center items-center gap-2"
          >
            {isPending ? (
              <span className="material-symbols-outlined animate-spin">refresh</span>
            ) : (
              "Sign In to Dashboard"
            )}
          </button>
          
          <div className="text-center mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 mb-1 font-medium">Default Admin Credentials:</p>
            <p className="text-xs text-slate-700 font-mono">admin@tabsy.com / AdminPass123!</p>
          </div>
        </form>
      </div>
    </div>
  );
}
