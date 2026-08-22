"use client";

import { usePathname } from "next/navigation";

export default function AdminHeader() {
  const pathname = usePathname();
  
  let title = "Overview";
  if (pathname.includes("/merchants")) title = "Merchants Management";
  if (pathname.includes("/config")) title = "System Configuration";
  if (pathname.includes("/logs")) title = "System Logs";

  return (
    <header className="bg-white border-b border-zinc-200 h-20 px-8 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-2xl font-bold text-zinc-800">{title}</h1>
      
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
          <span className="material-symbols-outlined text-slate-500">notifications</span>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-slate-800">Super Admin</p>
            <p className="text-xs text-slate-500">admin@tabsy.com</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200">
            SA
          </div>
        </div>
      </div>
    </header>
  );
}
