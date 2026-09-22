"use server";

import { revalidatePath } from "next/cache";
import { hashSync } from "@node-rs/bcrypt";
import { supabase } from "../../lib/supabase";
import { AdminMerchantCreateSchema, type ActionState } from "../../lib/definitions";
import { logSystemEvent } from "./logs";
import { getAdminSession } from "../../lib/admin-session";

export async function getAdminMerchants() {
  const { data, error } = await supabase
    .from("merchants")
    .select(`
      id, shop_name, merchant_name, phone, status, created_at,
      customers (id),
      transactions (id)
    `)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((m) => ({
    ...m,
    customers_count: m.customers.length,
    transactions_count: m.transactions.length,
  }));
}

export async function createMerchantByAdmin(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await getAdminSession();
  if (!session) return { message: "Unauthorized" };

  const raw = {
    shop_name: formData.get("shop_name"),
    merchant_name: formData.get("merchant_name"),
    phone: formData.get("phone"),
    pin: formData.get("pin"),
    status: formData.get("status") || "active",
  };

  const validated = AdminMerchantCreateSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { shop_name, merchant_name, phone, pin, status } = validated.data;

  const { data: existing } = await supabase
    .from("merchants")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existing) {
    return { errors: { phone: ["Phone number already registered"] } };
  }

  const pin_hash = hashSync(pin, 12);

  const { data: merchant, error } = await supabase
    .from("merchants")
    .insert({ shop_name, merchant_name, phone, pin_hash, status })
    .select("id")
    .single();

  if (error || !merchant) {
    return { message: "Failed to create merchant" };
  }

  await logSystemEvent({
    actor_type: "admin",
    actor_id: session.adminId,
    action: "create_merchant",
    entity_type: "merchant",
    entity_id: merchant.id,
    metadata: { shop_name, phone },
  });

  revalidatePath("/admin/merchants");
  return { message: "Merchant created successfully" };
}

export async function updateMerchantStatus(id: string, status: "active" | "suspended") {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("merchants")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error("Failed to update status");

  await logSystemEvent({
    actor_type: "admin",
    actor_id: session.adminId,
    action: `merchant_${status}`,
    entity_type: "merchant",
    entity_id: id,
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${id}`);
}

export async function deleteMerchant(id: string) {
  const session = await getAdminSession();
  if (!session || session.role !== "super_admin") {
    throw new Error("Unauthorized: Super Admin required");
  }

  const { error } = await supabase.from("merchants").delete().eq("id", id);
  if (error) throw new Error("Failed to delete merchant");

  await logSystemEvent({
    actor_type: "admin",
    actor_id: session.adminId,
    action: "delete_merchant",
    entity_type: "merchant",
    entity_id: id,
  });

  revalidatePath("/admin/merchants");
}

export async function reinitializeMerchantAccount(id: string) {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  // Fetch merchant to get details for system logging
  const { data: merchant, error: fetchErr } = await supabase
    .from("merchants")
    .select("id, shop_name, phone")
    .eq("id", id)
    .single();

  if (fetchErr || !merchant) {
    throw new Error("Merchant not found");
  }

  // 1. Clean Stock Movements
  await supabase.from("stock_movements").delete().eq("merchant_id", id);

  // 2. Fetch Stock Items & Clean Packs and Items
  const { data: stockItems } = await supabase
    .from("stock_items")
    .select("id")
    .eq("merchant_id", id);

  if (stockItems && stockItems.length > 0) {
    const itemIds = stockItems.map((i) => i.id);
    await supabase.from("stock_item_packs").delete().in("stock_item_id", itemIds);
  }
  await supabase.from("stock_items").delete().eq("merchant_id", id);

  // 3. Fetch Orders & Clean Order Items and Orders
  const { data: orders } = await supabase
    .from("orders")
    .select("id")
    .eq("merchant_id", id);

  if (orders && orders.length > 0) {
    const orderIds = orders.map((o) => o.id);
    await supabase.from("order_items").delete().in("order_id", orderIds);
  }
  await supabase.from("orders").delete().eq("merchant_id", id);

  // 4. Clean Transactions
  await supabase.from("transactions").delete().eq("merchant_id", id);

  // 5. Clean Customers
  await supabase.from("customers").delete().eq("merchant_id", id);

  // 6. Clean Daily Registers & Sales Aggregates
  await supabase.from("daily_registers").delete().eq("merchant_id", id);
  await supabase.from("daily_sales_aggregates").delete().eq("merchant_id", id);

  // 7. Log System Event
  await logSystemEvent({
    actor_type: "admin",
    actor_id: session.adminId,
    action: "reinitialize_merchant_account",
    entity_type: "merchant",
    entity_id: id,
    metadata: {
      shop_name: merchant.shop_name,
      phone: merchant.phone,
      reinitialized_at: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${id}`);
  revalidatePath("/admin/logs");

  return { success: true, message: `Account for ${merchant.shop_name} has been reinitialized.` };
}

