import { db, type OfflineSyncItem } from "./db";
import { processOfflineQueueItem } from "@/app/actions/offlineSync";

let isSyncing = false;
const listeners: Array<() => void> = [];

export function subscribeSyncStatus(listener: () => void) {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

export async function queueOfflineTransaction(
  type: OfflineSyncItem["type"],
  payload: OfflineSyncItem["payload"]
): Promise<number> {
  const id = await db.offlineSyncQueue.add({
    type,
    payload,
    createdAt: Date.now(),
    status: "pending",
  });
  notifyListeners();
  triggerSync();
  return id as number;
}

export async function triggerSync(): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || isSyncing) {
    return;
  }

  isSyncing = true;
  notifyListeners();

  try {
    const pendingItems = await db.offlineSyncQueue
      .where("status")
      .equals("pending")
      .sortBy("createdAt");

    for (const item of pendingItems) {
      if (!navigator.onLine) break;

      const res = await processOfflineQueueItem(item);
      if (res.success && item.id) {
        await db.offlineSyncQueue.delete(item.id);
      } else if (item.id) {
        await db.offlineSyncQueue.update(item.id, {
          status: "failed",
          errorMessage: res.message,
        });
      }
      notifyListeners();
    }
  } catch (err) {
    console.error("Dexie sync engine error:", err);
  } finally {
    isSyncing = false;
    notifyListeners();
  }
}

export function initSyncEngine() {
  if (typeof window === "undefined") return;

  window.addEventListener("online", () => {
    triggerSync();
  });

  // Periodically check if there are pending items to sync
  setInterval(() => {
    if (navigator.onLine) {
      triggerSync();
    }
  }, 15000);

  // Initial trigger if online
  if (navigator.onLine) {
    triggerSync();
  }
}
