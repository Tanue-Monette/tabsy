import { db, type OfflineSyncItem, type CachedCustomer, type CachedTransaction, type CachedStockItem } from "./db";
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

export function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Cache server stock items into Dexie IndexedDB
 */
export async function cacheOnlineStockItems(items: Array<CachedStockItem>) {
  if (typeof window === "undefined") return;
  try {
    await db.cachedStockItems.clear();
    const serverItems: CachedStockItem[] = items.map((i) => ({
      ...i,
      updatedAt: Date.now(),
    }));
    await db.cachedStockItems.bulkPut(serverItems);
    notifyListeners();
  } catch (err) {
    console.error("Failed to cache online stock items:", err);
  }
}

/**
 * Cache server customers into Dexie IndexedDB
 */
export async function cacheOnlineCustomers(customers: Array<{ id: string; name: string; phone: string | null; balance: number }>) {
  if (typeof window === "undefined") return;
  try {
    const pendingCustomers = await db.cachedCustomers.filter((c) => !!c.isPending).toArray();
    await db.cachedCustomers.clear();
    const serverCustomers: CachedCustomer[] = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      balance: c.balance,
      isPending: false,
      updatedAt: Date.now(),
    }));
    await db.cachedCustomers.bulkPut([...serverCustomers, ...pendingCustomers]);
    notifyListeners();
  } catch (err) {
    console.error("Failed to cache online customers:", err);
  }
}

/**
 * Cache server transactions into Dexie IndexedDB
 */
export async function cacheOnlineTransactions(transactions: Array<{ id: string; customer_id: string; type: "debt" | "payment"; amount: number; description?: string | null; method?: string | null; created_at: string }>) {
  if (typeof window === "undefined") return;
  try {
    const pendingTxs = await db.cachedTransactions.filter((t) => !!t.isPending).toArray();
    await db.cachedTransactions.clear();
    const serverTxs: CachedTransaction[] = transactions.map((t) => ({
      ...t,
      isPending: false,
    }));
    await db.cachedTransactions.bulkPut([...serverTxs, ...pendingTxs]);
    notifyListeners();
  } catch (err) {
    console.error("Failed to cache online transactions:", err);
  }
}

/**
 * Queue an offline item AND optimistically update local Dexie stores so the UI displays it immediately!
 */
export async function queueOfflineTransaction(
  type: OfflineSyncItem["type"],
  payload: OfflineSyncItem["payload"]
): Promise<number> {
  const queueId = await db.offlineSyncQueue.add({
    type,
    payload,
    createdAt: Date.now(),
    status: "pending",
  });

  const nowIso = new Date().toISOString();
  let tempCustId = payload.customer_id;

  if (type === "add_debt_with_customer" && !tempCustId && payload.new_name) {
    tempCustId = "temp_" + Date.now();
    await db.cachedCustomers.put({
      id: tempCustId,
      name: payload.new_name,
      phone: payload.new_phone ?? null,
      balance: payload.amount,
      isPending: true,
      updatedAt: Date.now(),
    });
  } else if (tempCustId) {
    const existing = await db.cachedCustomers.get(tempCustId);
    const delta = type === "payment" ? -payload.amount : payload.amount;
    const newBalance = (existing?.balance ?? 0) + delta;
    await db.cachedCustomers.put({
      id: tempCustId,
      name: existing?.name ?? "Customer",
      phone: existing?.phone ?? null,
      balance: newBalance,
      isPending: true,
      updatedAt: Date.now(),
    });
  }

  if (tempCustId) {
    await db.cachedTransactions.put({
      id: "tx_temp_" + Date.now(),
      customer_id: tempCustId,
      type: type === "payment" ? "payment" : "debt",
      amount: payload.amount,
      description:
        payload.description ??
        payload.reference ??
        (type === "order" ? `Order (${payload.items?.length ?? 0} item${(payload.items?.length ?? 0) === 1 ? "" : "s"})` : undefined) ??
        null,
      method: payload.method ?? null,
      created_at: nowIso,
      isPending: true,
    });
  }

  notifyListeners();
  triggerSync();
  return queueId as number;
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

  setInterval(() => {
    if (navigator.onLine) {
      triggerSync();
    }
  }, 15000);

  if (navigator.onLine) {
    triggerSync();
  }
}
