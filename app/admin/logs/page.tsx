import { getSystemLogs } from "@/app/actions/admin/logs";

export default async function SystemLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ actor?: string }>;
}) {
  const { actor } = await searchParams;
  const logs = await getSystemLogs(200, actor);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
        <div>
          <h2 className="text-lg font-bold text-slate-800">System Activity Logs</h2>
          <p className="text-sm text-slate-500">Real-time audit trail of all platform events.</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/logs"
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              !actor ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All
          </a>
          <a
            href="/admin/logs?actor=admin"
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              actor === "admin" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
            }`}
          >
            Admins
          </a>
          <a
            href="/admin/logs?actor=merchant"
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
              actor === "merchant" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Merchants
          </a>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-md ${
                        log.actor_type === "admin" ? "bg-purple-100 text-purple-700" :
                        log.actor_type === "merchant" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-700"
                      }`}>
                        {log.actor_type.toUpperCase()}
                      </span>
                      {log.actor_id && <p className="text-[10px] text-slate-400 font-mono mt-1 w-24 truncate" title={log.actor_id}>{log.actor_id}</p>}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.entity_type ? (
                        <>
                          <span className="font-medium">{log.entity_type}</span>
                          {log.entity_id && <p className="text-[10px] text-slate-400 font-mono w-24 truncate" title={log.entity_id}>{log.entity_id}</p>}
                        </>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.metadata ? (
                        <pre className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-md max-w-xs overflow-x-auto border border-zinc-100">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
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
