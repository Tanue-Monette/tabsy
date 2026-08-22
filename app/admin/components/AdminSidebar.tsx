"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminLogout } from "@/app/actions/admin/auth";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/admin", icon: "dashboard" },
    { label: "Merchants", href: "/admin/merchants", icon: "storefront" },
    { label: "System Config", href: "/admin/config", icon: "settings" },
    { label: "System Logs", href: "/admin/logs", icon: "list_alt" },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen fixed top-0 left-0">
      <div className="p-6 flex items-center gap-3 bg-slate-950 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
          <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
        </div>
        <h2 className="text-white font-bold tracking-wide">Tabsy Admin</h2>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 font-medium"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={() => adminLogout()}
          className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-xl hover:bg-slate-800 hover:text-white transition-all text-red-400 hover:text-red-300"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
