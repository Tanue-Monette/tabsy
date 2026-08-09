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
    <form action={action} className="w-full space-y-8">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#424843] ml-1">
            {t.phoneNumber}
          </label>
          <div className="flex gap-2">
            <div className="h-14 px-3 flex items-center bg-[#e1e3e4] rounded-xl text-[#424843] font-medium text-sm">+237</div>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="6XX XXX XXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 h-14 px-5 bg-[#e1e3e4] border-none rounded-xl text-[#191c1d] placeholder:text-[#424843]/50 focus:ring-2 focus:ring-[#2f4c39]/20 font-medium"
            />
          </div>
          {state?.errors?.phone && <p className="text-[#ba1a1a] text-xs ml-1">{state.errors.phone[0]}</p>}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#424843]">{t.securityPin}</label>
            <Link href={`/${lang}/forgot-pin`} className="text-[0.6875rem] font-semibold uppercase tracking-widest text-[#9d4300]">{t.forgotPin}</Link>
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
              className="w-full h-14 px-5 bg-[#e1e3e4] border-none rounded-xl text-[#191c1d] placeholder:text-[#424843]/50 focus:ring-2 focus:ring-[#2f4c39]/20 font-medium tracking-[0.5em] text-xl"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#424843]">visibility_off</span>
          </div>
          {state?.errors?.pin && <p className="text-[#ba1a1a] text-xs ml-1">{state.errors.pin[0]}</p>}
        </div>
      </div>

      {state?.message && (
        <p className="text-[#ba1a1a] text-sm text-center bg-[#ffdad6] px-4 py-3 rounded-xl">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending || !isValid}
        className="w-full h-14 bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white font-bold rounded-xl shadow-lg active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <span>{pending ? t.loggingIn : t.login}</span>
        {!pending && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
      </button>
    </form>
  );
}
