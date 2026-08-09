"use client";

import { useState, use } from "react";
import Link from "next/link";

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const [provider, setProvider] = useState<"mtn" | "orange">("mtn");

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] min-h-screen flex flex-col">
      <main className="flex-1 px-6 pt-20 pb-12 max-w-md mx-auto w-full">
        <header className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#e7e8e9] flex items-center justify-center">
              <span className="material-symbols-outlined text-[#183524] text-3xl">shopping_cart_checkout</span>
            </div>
          </div>
          <p className="text-[#424843] font-medium tracking-wide uppercase text-[0.6875rem] mb-2">Checkout Total</p>
          <div className="flex items-baseline justify-center gap-1">
            <h1 className="text-[3.5rem] font-black tracking-tight text-[#183524] leading-none">12,000</h1>
            <span className="text-xl font-bold text-[#183524] opacity-40">FCFA</span>
          </div>
        </header>

        <section className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-[#191c1d] font-bold text-lg mb-6">Select provider</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setProvider("mtn")}
              className={`relative flex flex-col items-center p-4 rounded-xl transition-all border-2 ${provider === "mtn" ? "bg-[#e7e8e9] border-[#183524]" : "bg-[#f3f4f5] border-transparent hover:bg-[#e7e8e9]"}`}
            >
              {provider === "mtn" && (
                <div className="absolute top-2 right-2">
                  <span className="material-symbols-outlined text-[#183524] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                </div>
              )}
              <div className="w-12 h-12 bg-[#FFCC00] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="MTN Logo" className="w-8 h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsa6lLxqiiHDpuCUtsoNycTNNvJKjInGxyLRp5uj4emwExnsfqtpqsD3j6hBOGfMxrw9ItB_FNHghaED8R5WuVN2N46YWHoiH-unnTmx8N7GFQS-CkjIJh8SnvxV3Sgw59Vgo_KLktHrN6fpNl9CnPGxYki7geU6dOeuuvp15tmmd8NNfyuxs1U-AgSWB9QLxznyRuWGA1Va8d4pR9sdRXRaQZ4FS5tiAIxLJNynEXTyfxVx5twb2CUMBNPTzKo_hH-xON8eCLBE1T" />
              </div>
              <span className="text-sm font-bold text-[#191c1d]">MTN MoMo</span>
            </button>

            <button
              onClick={() => setProvider("orange")}
              className={`flex flex-col items-center p-4 rounded-xl transition-all border-2 ${provider === "orange" ? "bg-[#e7e8e9] border-[#183524]" : "bg-[#f3f4f5] border-transparent hover:bg-[#e7e8e9]"}`}
            >
              <div className="w-12 h-12 bg-[#FF6600] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="Orange Money Logo" className="w-8 h-8" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYK2Ma5kPJm59ejRl4JfpmmBwC5gZBEU8nF0bVX1peG2Tl7su08N4E22mmJHeMlunAVmUDP9BGUX0JZAk9blceBViYZ6JfnhqwUZ1mBwG9DyPa9gknOVeFJyCAl3x8e9uyaDq81qAXoHq_m1UEmg2VwAqjHvkqYpNc6L1CgBI5qRnako7TsOH4014gBU6iVlEfeP-cAR877KeYLaQrSqWf0j3IoiP8VUYtUUDnyYuRuPfvrXY0XX9Rhe1tAcO51j5SltEHSbRq5ti3" />
              </div>
              <span className="text-sm font-bold text-[#191c1d]">Orange Money</span>
            </button>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-bold text-[#191c1d] mb-2" htmlFor="phone">Phone number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="text-[#424843] font-medium">+237</span>
              </div>
              <input className="w-full pl-16 pr-4 py-4 bg-[#e1e3e4] border-none rounded-lg focus:ring-2 focus:ring-[#183524]/20 focus:bg-white transition-all text-[#191c1d] font-medium text-lg placeholder:text-[#424843]/40" id="phone" placeholder="6XX XXX XXX" type="tel" />
            </div>
          </div>

          <div className="flex gap-3 p-4 bg-[#ffdbca]/30 rounded-lg mb-8">
            <span className="material-symbols-outlined text-[#9d4300] text-xl">info</span>
            <p className="text-sm text-[#783200] leading-relaxed">You will receive a prompt on your phone to confirm payment</p>
          </div>

          <button className="w-full py-5 bg-gradient-to-r from-[#183524] to-[#2f4c39] text-white font-black text-lg rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            Pay Now<span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </section>

        <footer className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-[#424843]/60">
            <span className="material-symbols-outlined text-sm">lock</span>
            <span className="text-[0.6875rem] font-medium tracking-widest uppercase">Secured by Editorial Ledger</span>
          </div>
          <div className="flex gap-6 opacity-30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Visa" className="h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD5xJkKGnqhw0u2MbLefWc22IC2FxWHqcl7X3BSmLFbdqbu8xQYoupZRR_pBdPlMgWqZCEDEXJq284Dm_6m8_cR3c08zYFOsruCBa0dnjKsNmV_iprFkO1V3G2XwUdvJcncr2wlU9_jJD3Eu0ghQ9OHikBRUn2ItVOzkopvPC6EQ_T2NrGyAlMk4FghKdBbGaahOWUdSB2ZoAyxh7YW0B7FtrsRvXij5tKlkY6jh7XLo08gtCA7BwjkGvMc5cLElcxy0RtHn8SiYIje" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="Mastercard" className="h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXguSPgHLxa7RV2Uv7FpwxeS2fsGJOj7F4cVX40FRy9qSTv-ZEzOahbZlVNf_jQl5qPeOfLLbK-kzGB_SXD_3gPBUMUWh9PX4I-W4TKcBD-CZFJh9VSZ_rHE1iU1jxjxkcHN-6z3quaIXV5IhpNYsaOWcx6TNMtCFrncYjeM5RRMFO5YWsKKHoFQNTjq1Qnn1-QFZi8wJ8tJGiS5qYzZ-3y7f62pFGzQdKT4-uaFQ49EzoMv5F-DpM-xRu3uXRtbIOXjM4Z3QYby-e" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt="PCI DSS" className="h-4" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1c-iDIhEFzLPiGv3ZNVn11Q6HJzBDeH4VoDdkrLWMGueS0QowVHNx_nB2yc0PEHZhzhtbHreUqArSfVPlKq6nPx1-wm-s-002nwWRIVuYRbbkFScNvVtWi5_nlLLudAniuS_-9EfkOj80Ti3V514IJ6smJ5sCoFKEtNuZ76Eeslc4oEU9fu2Y0q2w61R_ol4dX-oJ4Rl2YlOsNCsaJQWepFFPOOzWwCGH7dnne-wAA4Vt_4a3t8Ajvg8ggg3kaZ61meBHKxMjiMnD" />
          </div>
        </footer>
      </main>
    </div>
  );
}
