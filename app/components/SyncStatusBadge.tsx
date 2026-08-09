"use client";

import { useEffect, useState } from "react";
import { db } from "@/app/lib/db";
import { initSyncEngine, subscribeSyncStatus, triggerSync } from "@/app/lib/syncEngine";

export default function SyncStatusBadge() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncedRecently, setSyncedRecently] = useState(false);

  useEffect(() => {
    initSyncEngine();

    const updateStatus = async () => {
      setIsOnline(navigator.onLine);
      try {
        const count = await db.offlineSyncQueue.where("status").equals("pending").count();
        setPendingCount(count);
        if (count === 0 && pendingCount > 0) {
          setSyncedRecently(true);
          setTimeout(() => setSyncedRecently(false), 3000);
        }
      } catch (err) {
        console.error("Error reading Dexie queue count:", err);
      }
    };

    updateStatus();

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    const unsubscribe = subscribeSyncStatus(updateStatus);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      unsubscribe();
    };
  }, []);

  if (isOnline && pendingCount === 0 && !syncedRecently) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom duration-300">
      {!isOnline && (
        <div className="bg-[#9d4300] text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-white/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="material-symbols-outlined text-sm">wifi_off</span>
          <span>
            {pendingCount > 0
              ? `Offline — ${pendingCount} change${pendingCount > 1 ? "s" : ""} queued`
              : "Offline Mode"}
          </span>
        </div>
      )}

      {isOnline && pendingCount > 0 && (
        <div className="bg-[#183524] text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-emerald-500/30">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          <span>Syncing {pendingCount} item{pendingCount > 1 ? "s" : ""} to database...</span>
        </div>
      )}

      {isOnline && pendingCount === 0 && syncedRecently && (
        <div className="bg-emerald-800 text-white px-4 py-2 rounded-full shadow-lg text-xs font-bold flex items-center gap-2 border border-emerald-400/30">
          <span className="material-symbols-outlined text-sm text-emerald-300">check_circle</span>
          <span>All offline changes saved to Supabase!</span>
        </div>
      )}
    </div>
  );
}
