import Dexie, { type EntityTable } from "dexie";

export interface OfflineSyncItem {
  id?: number;
  type: "debt" | "payment" | "add_debt_with_customer";
  payload: {
    customer_id?: string;
    new_name?: string;
    new_phone?: string;
    amount: number;
    description?: string;
    method?: string;
    reference?: string;
  };
  createdAt: number;
  status: "pending" | "synced" | "failed";
  errorMessage?: string;
}

export class TabsyOfflineDB extends Dexie {
  offlineSyncQueue!: EntityTable<OfflineSyncItem, "id">;

  constructor() {
    super("TabsyOfflineDB");
    this.version(1).stores({
      offlineSyncQueue: "++id, type, status, createdAt",
    });
  }
}

export const db = new TabsyOfflineDB();
