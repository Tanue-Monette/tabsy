"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/db";
import { subscribeSyncStatus, triggerSync } from "@/app/lib/syncEngine";

export default function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [failedCount, setFailedCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const updateOnline = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    const loadCounts = async () => {
      try {
        const pending = await db.offlineSyncQueue.where("status").equals("pending").count();
        const failed = await db.offlineSyncQueue.where("status").equals("failed").count();
        setPendingCount(pending);
        setFailedCount(failed);
      } catch (err) {
        console.error("Dexie queue count error:", err);
      }
    };

    loadCounts();
    const unsubscribe = subscribeSyncStatus(loadCounts);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      unsubscribe();
    };
  }, []);

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await db.offlineSyncQueue.where("status").equals("failed").modify({ status: "pending" });
      await triggerSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Completely hidden when online with no pending or failed items
  if (isOnline && pendingCount === 0 && failedCount === 0) {
    return null;
  }

  // Full-width sticky banner displayed directly below the header
  return (
    <div className="sticky top-0 z-[60] w-full transition-all">
      {!isOnline ? (
        <div className="bg-amber-500 text-white font-bold text-xs py-2 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>
              Offline Mode — {pendingCount + failedCount} transaction{pendingCount + failedCount === 1 ? "" : "s"} saved locally
            </span>
          </div>
          <span className="text-[10px] uppercase font-black tracking-wider opacity-80">Auto-sync when back online</span>
        </div>
      ) : failedCount > 0 ? (
        <div className="bg-rose-600 text-white font-bold text-xs py-2 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sync_problem</span>
            <span>
              {failedCount} sync error{failedCount === 1 ? "" : "s"} detected
            </span>
          </div>
          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing}
            className="bg-white text-rose-700 px-3 py-1 rounded-lg text-xs font-black hover:bg-rose-50 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            {isSyncing ? "Syncing..." : "Retry Sync Now"}
          </button>
        </div>
      ) : (
        <div className="bg-blue-600 text-white font-bold text-xs py-2 px-6 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
            <span>
              Syncing {pendingCount} offline transaction{pendingCount === 1 ? "" : "s"} to database...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
