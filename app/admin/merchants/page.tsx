import { getAdminMerchants } from "@/app/actions/admin/merchants";
import Link from "next/link";
import MerchantActions from "./MerchantActions";

export default async function AdminMerchantsPage() {
  const merchants = await getAdminMerchants();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Merchants Directory</h2>
          <p className="text-sm text-slate-500">Manage all registered shops and their access.</p>
        </div>
        <Link
          href="/admin/merchants/create"
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Merchant
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Shop</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Customers</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No merchants found. Create one to get started.
                  </td>
                </tr>
              ) : (
                merchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-800">{merchant.shop_name}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{merchant.merchant_name}</p>
                      <p className="text-xs text-slate-400">{merchant.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${merchant.status === "active"
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                          : "bg-red-50 text-red-600 border border-red-100"
                        }`}>
                        {merchant.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {merchant.customers_count}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(merchant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <MerchantActions merchantId={merchant.id} currentStatus={merchant.status as "active" | "suspended"} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
