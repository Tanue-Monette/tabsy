import Dexie, { type EntityTable } from "dexie";

export interface OfflineSyncItem {
  id?: number;
  type: "debt" | "payment" | "add_debt_with_customer" | "order";
  payload: {
    customer_id?: string;
    new_name?: string;
    new_phone?: string;
    amount: number;
    description?: string;
    method?: string;
    reference?: string;
    items?: { stock_item_id: string; quantity: number; unit_price: number; name?: string }[];
  };
  createdAt: number;
  status: "pending" | "synced" | "failed";
  errorMessage?: string;
}

export interface CachedCustomer {
  id: string;
  name: string;
  phone: string | null;
  balance: number;
  isPending?: boolean;
  updatedAt?: number;
}

export interface CachedTransaction {
  id: string;
  customer_id: string;
  type: "debt" | "payment";
  amount: number;
  description?: string | null;
  method?: string | null;
  created_at: string;
  isPending?: boolean;
}

export interface CachedMerchantSettings {
  id: string;
  max_debt_limit?: number;
  cash_enabled?: boolean;
  mtn_enabled?: boolean;
  orange_enabled?: boolean;
  debt_reminders?: boolean;
  weekly_reports?: boolean;
}

export class TabsyOfflineDB extends Dexie {
  offlineSyncQueue!: EntityTable<OfflineSyncItem, "id">;
  cachedCustomers!: EntityTable<CachedCustomer, "id">;
  cachedTransactions!: EntityTable<CachedTransaction, "id">;
  merchantSettings!: EntityTable<CachedMerchantSettings, "id">;

  constructor() {
    super("TabsyOfflineDB");
    this.version(2).stores({
      offlineSyncQueue: "++id, type, status, createdAt",
      cachedCustomers: "id, name, balance, isPending, updatedAt",
      cachedTransactions: "id, customer_id, type, created_at, isPending",
      merchantSettings: "id",
    });
  }
}

export const db = new TabsyOfflineDB();
