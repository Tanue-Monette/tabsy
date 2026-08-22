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
