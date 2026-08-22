import { supabase } from "@/app/lib/supabase";
import { getSystemLogs } from "@/app/actions/admin/logs";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [merchantsResult, logsResult] = await Promise.all([
    supabase.from("merchants").select("id, status", { count: "exact" }),
    getSystemLogs(5),
  ]);

  const merchants = merchantsResult.data || [];
  const totalMerchants = merchantsResult.count || 0;
  const activeMerchants = merchants.filter((m) => m.status === "active").length;
  const suspendedMerchants = merchants.filter((m) => m.status === "suspended").length;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Total Merchants</p>
            <h3 className="text-3xl font-black text-slate-800">{totalMerchants}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">storefront</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Active Merchants</p>
            <h3 className="text-3xl font-black text-emerald-600">{activeMerchants}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Suspended</p>
            <h3 className="text-3xl font-black text-red-600">{suspendedMerchants}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">block</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Recent System Activity</h2>
            <Link href="/admin/logs" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
              View All
            </Link>
          </div>
          <div className="divide-y divide-zinc-50">
            {logsResult.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No recent activity.</div>
            ) : (
              logsResult.map((log) => (
                <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    log.actor_type === "admin" ? "bg-purple-100 text-purple-700" :
                    log.actor_type === "merchant" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-700"
                  }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {log.actor_type === "admin" ? "admin_panel_settings" :
                       log.actor_type === "merchant" ? "storefront" : "memory"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      <span className="font-bold capitalize">{log.actor_type}</span> performed <span className="font-bold text-emerald-600">{log.action}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden text-white flex flex-col items-center justify-center p-8 text-center relative">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 p-32 bg-blue-500/10 blur-[100px] rounded-full"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md border border-white/20">
              <span className="material-symbols-outlined text-4xl text-emerald-400">rocket_launch</span>
            </div>
            <h2 className="text-2xl font-black mb-3">System Healthy</h2>
            <p className="text-slate-400 text-sm mb-8 max-w-[250px] mx-auto">
              All services are running normally. No active alerts or warnings.
            </p>
            <Link 
              href="/admin/merchants"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-500/20 transition-all"
            >
              Manage Merchants
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
