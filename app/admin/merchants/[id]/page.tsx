import { notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";
import MerchantActions from "../MerchantActions";

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: merchant, error } = await supabase
    .from("merchants")
    .select(`
      *,
      customers (id),
      transactions (id, type, amount, created_at)
    `)
    .eq("id", id)
    .single();

  if (error || !merchant) {
    notFound();
  }

  const customersCount = merchant.customers.length;
  const totalSales = merchant.transactions
    .filter((t: any) => t.type === "payment")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
  const totalDebts = merchant.transactions
    .filter((t: any) => t.type === "debt")
    .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <div className="flex items-center gap-4">
          <Link href="/admin/merchants" className="w-10 h-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:bg-zinc-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-800">{merchant.shop_name}</h2>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${merchant.status === "active"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                {merchant.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-500">ID: <span className="font-mono text-xs">{merchant.id}</span></p>
          </div>
        </div>

        <div className="group opacity-100">
          {/* We wrap MerchantActions with opacity-100 because it defaults to opacity-0 group-hover:opacity-100 in table context */}
          <MerchantActions merchantId={merchant.id} currentStatus={merchant.status as "active" | "suspended"} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Merchant Profile</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Owner Name</p>
              <p className="font-medium text-slate-800">{merchant.merchant_name}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone Number</p>
              <p className="font-medium text-slate-800 font-mono">{merchant.phone}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joined Date</p>
              <p className="font-medium text-slate-800">{new Date(merchant.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Platform Usage</h3>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customers</p>
              <p className="text-2xl font-black text-slate-800">{customersCount}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Transactions</p>
              <p className="text-2xl font-black text-slate-800">{merchant.transactions.length}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Sales</p>
              <p className="text-xl font-bold text-emerald-600">{totalSales.toLocaleString()} <span className="text-xs">FCFA</span></p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Debts</p>
              <p className="text-xl font-bold text-amber-600">{totalDebts.toLocaleString()} <span className="text-xs">FCFA</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
