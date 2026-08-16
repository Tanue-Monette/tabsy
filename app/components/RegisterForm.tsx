"use client";

import { useActionState, useState } from "react";
import { register } from "@/app/actions/auth";
import Link from "next/link";
import type { Dictionary } from "@/app/lib/i18n";

type Props = { lang: string; t: Dictionary["auth"] };

export default function RegisterForm({ lang, t }: Props) {
  const [state, action, pending] = useActionState(register, undefined);
  const [shopName, setShopName] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [terms, setTerms] = useState(false);

  const phoneDigits = phone.replace(/\D/g, "");
  const isValid =
    shopName.trim().length >= 2 &&
    merchantName.trim().length >= 2 &&
    phoneDigits.length >= 9 &&
    pin.length === 4 &&
    terms;

  return (
    <form action={action} className="w-full space-y-6">
      <input type="hidden" name="lang" value={lang} />
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">{t.shopName}</label>
          <input name="shop_name" type="text" placeholder={t.shopNamePlaceholder} value={shopName} onChange={(e) => setShopName(e.target.value)}
            className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium" />
          {state?.errors?.shop_name && <p className="text-rose-600 text-xs mt-1 ml-1 font-semibold">{state.errors.shop_name[0]}</p>}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">{t.merchantName}</label>
          <input name="merchant_name" type="text" placeholder={t.merchantNamePlaceholder} value={merchantName} onChange={(e) => setMerchantName(e.target.value)}
            className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium" />
          {state?.errors?.merchant_name && <p className="text-rose-600 text-xs mt-1 ml-1 font-semibold">{state.errors.merchant_name[0]}</p>}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">{t.phoneNumber}</label>
          <div className="flex gap-2">
            <div className="h-14 px-4 flex items-center bg-zinc-100 rounded-2xl text-zinc-600 font-bold text-sm border border-zinc-200/80">+237</div>
            <input name="phone" type="tel" inputMode="numeric" placeholder="6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="flex-grow h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 font-medium" />
          </div>
          {state?.errors?.phone && <p className="text-rose-600 text-xs mt-1 ml-1 font-semibold">{state.errors.phone[0]}</p>}
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1.5 ml-1">{t.pinLabel}</label>
          <div className="relative flex items-center">
            <input name="pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full h-14 px-4 bg-zinc-100 border-none rounded-2xl focus:ring-2 focus:ring-[#18181b] focus:bg-white transition-all text-[#18181b] placeholder:text-zinc-400 text-center text-2xl tracking-[1em]" />
            <span className="material-symbols-outlined absolute right-4 text-zinc-400">lock</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 px-1 font-medium">{t.pinHint}</p>
          {state?.errors?.pin && <p className="text-rose-600 text-xs mt-1 ml-1 font-semibold">{state.errors.pin[0]}</p>}
        </div>
      </div>

      <div className="flex items-start gap-3 px-1 py-1">
        <input id="terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
          className="w-5 h-5 rounded border-zinc-300 text-[#18181b] focus:ring-[#18181b] mt-0.5 accent-[#18181b]" />
        <label className="text-xs text-zinc-600 leading-tight font-medium" htmlFor="terms">
          {t.terms.split(t.termsLink)[0]}
          <span className="text-[#18181b] font-extrabold underline">{t.termsLink}</span>
          {t.terms.split(t.termsLink)[1]}
        </label>
      </div>

      {state?.message && <p className="text-rose-600 text-sm text-center bg-rose-50 border border-rose-100 px-4 py-3 rounded-2xl font-medium">{state.message}</p>}

      <button type="submit" disabled={pending || !isValid}
        className="w-full h-14 bg-[#18181b] hover:bg-[#27272a] text-white font-extrabold text-base rounded-2xl shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        {pending ? t.creatingAccount : t.createAccount}
        {!pending && <span className="material-symbols-outlined text-[#a3e635]">arrow_forward</span>}
      </button>

      <div className="text-center">
        <p className="text-zinc-500 text-xs font-medium">
          {t.alreadyHaveAccount}{" "}
          <Link className="text-[#18181b] font-extrabold hover:underline" href={`/${lang}`}>{t.login}</Link>
        </p>
      </div>
    </form>
  );
}
