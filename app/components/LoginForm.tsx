"use client";

import { useActionState, useState } from "react";
import { login } from "@/app/actions/auth";
import Link from "next/link";
import type { Dictionary } from "@/app/lib/i18n";

type Props = { lang: string; t: Dictionary["auth"] };

export default function LoginForm({ lang, t }: Props) {
  const [state, action, pending] = useActionState(login, undefined);
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const phoneDigits = phone.replace(/\D/g, "");
  const isValid = phoneDigits.length >= 9 && pin.length === 4;

  return (
    <form action={action} className="w-full space-y-6">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">
            {t.phoneNumber}
          </label>
          <div className="flex gap-2">
            <div className="h-14 px-4 flex items-center bg-zinc-100 rounded-2xl text-zinc-600 font-bold text-sm border border-zinc-200/80">+237</div>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 h-14 px-5 bg-zinc-100 border-none rounded-2xl text-[#18181b] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#18181b] focus:bg-white font-medium transition-all"
            />
          </div>
          {state?.errors?.phone && <p className="text-rose-600 text-xs ml-1 font-semibold">{state.errors.phone[0]}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{t.securityPin}</label>
            <Link href={`/${lang}/forgot-pin`} className="text-[10px] font-bold uppercase tracking-widest text-[#18181b] hover:text-[#a3e635] transition-colors">{t.forgotPin}</Link>
          </div>
          <div className="relative">
            <input
              name="pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full h-14 px-5 bg-zinc-100 border-none rounded-2xl text-[#18181b] placeholder:text-zinc-400 focus:ring-2 focus:ring-[#18181b] focus:bg-white font-medium tracking-[0.5em] text-xl transition-all"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400">visibility_off</span>
          </div>
          {state?.errors?.pin && <p className="text-rose-600 text-xs ml-1 font-semibold">{state.errors.pin[0]}</p>}
        </div>
      </div>

      {state?.message && (
        <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl font-medium">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending || !isValid}
        className="w-full h-14 bg-[#18181b] hover:bg-[#27272a] text-white font-extrabold rounded-2xl shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{pending ? t.loggingIn : t.login}</span>
        {!pending && <span className="material-symbols-outlined text-[#a3e635] group-hover:translate-x-1 transition-transform">arrow_forward</span>}
      </button>
    </form>
  );
}
