"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/app/lib/i18n";

type Props = { lang: string; t: Dictionary["nav"] };

export default function BottomNav({ lang, t }: Props) {
  const pathname = usePathname();

  const navItems = [
    { href: `/${lang}/dashboard`, icon: "dashboard", label: t.dashboard },
    { href: `/${lang}/customers`, icon: "group", label: t.customers },
    { href: `/${lang}/stock`, icon: "inventory_2", label: t.stock },
    { href: `/${lang}/transactions`, icon: "receipt_long", label: t.transactions },
    { href: `/${lang}/settings`, icon: "settings", label: t.settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/90 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] border-t border-zinc-200/80 rounded-t-3xl">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center px-3 py-2 transition-all duration-200 active:scale-95 rounded-2xl ${
              isActive ? "bg-[#18181b] text-[#a3e635] shadow-md shadow-[#18181b]/10 font-bold" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <span
              className="material-symbols-outlined mb-0.5 text-xl"
              style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
