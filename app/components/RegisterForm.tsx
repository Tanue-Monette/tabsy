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
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#424843] mb-1.5 ml-1">{t.shopName}</label>
          <input name="shop_name" type="text" placeholder={t.shopNamePlaceholder} value={shopName} onChange={(e) => setShopName(e.target.value)}
            className="w-full h-14 px-4 bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all placeholder:text-[#c2c8c1]" />
          {state?.errors?.shop_name && <p className="text-[#ba1a1a] text-xs mt-1 ml-1">{state.errors.shop_name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#424843] mb-1.5 ml-1">{t.merchantName}</label>
          <input name="merchant_name" type="text" placeholder={t.merchantNamePlaceholder} value={merchantName} onChange={(e) => setMerchantName(e.target.value)}
            className="w-full h-14 px-4 bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all placeholder:text-[#c2c8c1]" />
          {state?.errors?.merchant_name && <p className="text-[#ba1a1a] text-xs mt-1 ml-1">{state.errors.merchant_name[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#424843] mb-1.5 ml-1">{t.phoneNumber}</label>
          <div className="flex gap-2">
            <div className="h-14 px-3 flex items-center bg-[#e1e3e4] rounded-xl text-[#424843] font-medium">+237</div>
            <input name="phone" type="tel" inputMode="numeric" placeholder="6XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)}
              className="flex-grow h-14 px-4 bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all placeholder:text-[#c2c8c1]" />
          </div>
          {state?.errors?.phone && <p className="text-[#ba1a1a] text-xs mt-1 ml-1">{state.errors.phone[0]}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#424843] mb-1.5 ml-1">{t.pinLabel}</label>
          <div className="relative flex items-center">
            <input name="pin" type="password" inputMode="numeric" maxLength={4} placeholder="••••" value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full h-14 px-4 bg-[#e1e3e4] border-none rounded-xl focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all placeholder:text-[#c2c8c1] text-center text-2xl tracking-[1em]" />
            <span className="material-symbols-outlined absolute right-4 text-[#424843]/50">lock</span>
          </div>
          <p className="text-[0.6875rem] text-[#424843] mt-2 px-1">{t.pinHint}</p>
          {state?.errors?.pin && <p className="text-[#ba1a1a] text-xs mt-1 ml-1">{state.errors.pin[0]}</p>}
        </div>
      </div>

      <div className="flex items-start gap-3 px-1 py-2">
        <input id="terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)}
          className="w-5 h-5 rounded border-[#c2c8c1] text-[#183524] focus:ring-[#183524] mt-0.5" />
        <label className="text-sm text-[#424843] leading-tight" htmlFor="terms">
          {t.terms.split(t.termsLink)[0]}
          <span className="text-[#9d4300] font-semibold">{t.termsLink}</span>
          {t.terms.split(t.termsLink)[1]}
        </label>
      </div>

      {state?.message && <p className="text-[#ba1a1a] text-sm text-center bg-[#ffdad6] px-4 py-3 rounded-xl">{state.message}</p>}

      <button type="submit" disabled={pending || !isValid}
        className="w-full h-14 bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white font-bold text-lg rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
        {pending ? t.creatingAccount : t.createAccount}
        {!pending && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>

      <div className="text-center">
        <p className="text-[#424843]">
          {t.alreadyHaveAccount}{" "}
          <Link className="text-[#9d4300] font-bold hover:underline" href={`/${lang}`}>{t.login}</Link>
        </p>
      </div>
    </form>
  );
}
