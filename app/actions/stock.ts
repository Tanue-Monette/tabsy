"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { z } from "zod";
import { StockItemSchema, RestockSchema, type ActionState } from "@/app/lib/definitions";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export async function getStockItems() {
  const session = await requireSession();

  const { data } = await supabase
    .from("stock_items")
    .select("id, name, unit, cost_price, sell_price, quantity, low_stock_threshold")
    .eq("merchant_id", session.merchantId)
    .eq("is_archived", false)
    .order("name");

  return data ?? [];
}

export async function getStockItem(id: string) {
  const session = await requireSession();

  const { data } = await supabase
    .from("stock_items")
    .select("id, name, unit, cost_price, sell_price, quantity, low_stock_threshold")
    .eq("id", id)
    .eq("merchant_id", session.merchantId)
    .single();

  return data ?? null;
}

// Items at or below their low-stock threshold — the "replenish this" list
export async function getReplenishmentList() {
  const items = await getStockItems();
  return items
    .filter((i) => i.quantity <= i.low_stock_threshold)
    .sort((a, b) => a.quantity - b.quantity);
}

export async function addStockItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = StockItemSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit") || "pcs",
    cost_price: formData.get("cost_price") || 0,
    sell_price: formData.get("sell_price") || 0,
    quantity: formData.get("quantity") || 0,
    low_stock_threshold: formData.get("low_stock_threshold") || 5,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { error } = await supabase.from("stock_items").insert({
    merchant_id: session.merchantId,
    ...validated.data,
  });

  if (error) {
    if (error.code === "23505") {
      return { errors: { name: ["You already have an item with this name."] } };
    }
    return { message: "Failed to add item." };
  }

  revalidatePath("/stock");
  redirect("/stock");
}

export async function restockItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = RestockSchema.safeParse({
    stock_item_id: formData.get("stock_item_id"),
    quantity: formData.get("quantity"),
    unit_cost: formData.get("unit_cost") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { stock_item_id, quantity, unit_cost } = validated.data;

  const { error } = await supabase.from("stock_movements").insert({
    merchant_id: session.merchantId,
    stock_item_id,
    movement_type: "restock",
    quantity_change: quantity,
    unit_cost: unit_cost ?? null,
  });

  if (error) return { message: "Failed to record restock." };

  if (unit_cost) {
    await supabase
      .from("stock_items")
      .update({ cost_price: unit_cost })
      .eq("id", stock_item_id)
      .eq("merchant_id", session.merchantId);
  }

  revalidatePath("/stock");
  redirect("/stock");
}

const ArchiveSchema = z.object({ stock_item_id: z.string().uuid() });

export async function archiveStockItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = ArchiveSchema.safeParse({
    stock_item_id: formData.get("stock_item_id"),
  });
  if (!validated.success) return { message: "Invalid item." };

  const { error } = await supabase
    .from("stock_items")
    .update({ is_archived: true })
    .eq("id", validated.data.stock_item_id)
    .eq("merchant_id", session.merchantId);

  if (error) return { message: "Failed to archive item." };

  revalidatePath("/stock");
  redirect("/stock");
}
