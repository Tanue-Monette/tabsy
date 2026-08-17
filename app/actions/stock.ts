"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { z } from "zod";
import {
  StockItemSchema,
  StockItemPacksSchema,
  EditStockItemSchema,
  RestockSchema,
  type ActionState,
} from "@/app/lib/definitions";
import { getLocaleFromCookie } from "@/app/lib/get-locale";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export const getStockItems = cache(async () => {
  const session = await requireSession();

  const { data } = await supabase
    .from("stock_items")
    .select("id, name, unit, cost_price, sell_price, quantity, low_stock_threshold, stock_item_packs(id, name, size)")
    .eq("merchant_id", session.merchantId)
    .eq("is_archived", false)
    .order("name");

  return data ?? [];
});

export const getStockItem = cache(async (id: string) => {
  const session = await requireSession();

  const { data } = await supabase
    .from("stock_items")
    .select("id, name, unit, cost_price, sell_price, quantity, low_stock_threshold, stock_item_packs(id, name, size)")
    .eq("id", id)
    .eq("merchant_id", session.merchantId)
    .single();

  return data ?? null;
});

// Items at or below their low-stock threshold — the "replenish this" list
export const getReplenishmentList = cache(async () => {
  const items = await getStockItems();
  return items
    .filter((i) => i.quantity <= i.low_stock_threshold)
    .sort((a, b) => a.quantity - b.quantity);
});

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

  let parsedPacks: unknown = [];
  try {
    parsedPacks = JSON.parse(String(formData.get("packs") ?? "[]"));
  } catch {
    return { message: "Invalid pack data." };
  }

  const validatedPacks = StockItemPacksSchema.safeParse(parsedPacks);
  if (!validatedPacks.success) {
    return { message: validatedPacks.error.issues[0]?.message ?? "Invalid packs." };
  }

  const { data: item, error } = await supabase
    .from("stock_items")
    .insert({ merchant_id: session.merchantId, ...validated.data })
    .select("id")
    .single();

  if (error || !item) {
    if (error?.code === "23505") {
      return { errors: { name: ["You already have an item with this name."] } };
    }
    return { message: "Failed to add item." };
  }

  if (validatedPacks.data.length > 0) {
    const { error: packError } = await supabase.from("stock_item_packs").insert(
      validatedPacks.data.map((p) => ({
        stock_item_id: item.id,
        name: p.name,
        size: p.size,
      }))
    );
    if (packError) {
      return { message: "Item saved, but failed to save packs. Edit the item to add them." };
    }
  }

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/stock`);
  redirect(`/${lang}/stock`);
}

export async function updateStockItem(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = EditStockItemSchema.safeParse({
    stock_item_id: formData.get("stock_item_id"),
    name: formData.get("name"),
    unit: formData.get("unit") || "pcs",
    cost_price: formData.get("cost_price") || 0,
    sell_price: formData.get("sell_price") || 0,
    low_stock_threshold: formData.get("low_stock_threshold") || 5,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  let parsedPacks: unknown = [];
  try {
    parsedPacks = JSON.parse(String(formData.get("packs") ?? "[]"));
  } catch {
    return { message: "Invalid pack data." };
  }

  const validatedPacks = StockItemPacksSchema.safeParse(parsedPacks);
  if (!validatedPacks.success) {
    return { message: validatedPacks.error.issues[0]?.message ?? "Invalid packs." };
  }

  const { stock_item_id, ...fields } = validated.data;

  // Confirm ownership before mutating anything
  const { data: existing } = await supabase
    .from("stock_items")
    .select("id")
    .eq("id", stock_item_id)
    .eq("merchant_id", session.merchantId)
    .single();

  if (!existing) return { message: "Item not found." };

  const { error } = await supabase
    .from("stock_items")
    .update(fields)
    .eq("id", stock_item_id)
    .eq("merchant_id", session.merchantId);

  if (error) {
    if (error.code === "23505") {
      return { errors: { name: ["You already have an item with this name."] } };
    }
    return { message: "Failed to update item." };
  }

  // Packs are small in number and edited as a whole set — replace rather
  // than diff, simplest way to keep add/rename/remove all consistent.
  const { error: deleteError } = await supabase
    .from("stock_item_packs")
    .delete()
    .eq("stock_item_id", stock_item_id);

  if (deleteError) {
    return { message: "Item updated, but failed to update packs." };
  }

  if (validatedPacks.data.length > 0) {
    const { error: packError } = await supabase.from("stock_item_packs").insert(
      validatedPacks.data.map((p) => ({
        stock_item_id,
        name: p.name,
        size: p.size,
      }))
    );
    if (packError) {
      return { message: "Item updated, but failed to save packs." };
    }
  }

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/stock`);
  redirect(`/${lang}/stock`);
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
    pack_id: formData.get("pack_id") || undefined,
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { stock_item_id, quantity, unit_cost, pack_id } = validated.data;

  // Stock is always stored in base units. If the merchant entered the
  // quantity/cost in a pack (e.g. "3 crates"), convert both to base units
  // (bottles) before they ever touch stock_movements or stock_items.
  let baseQuantity = quantity;
  let baseUnitCost = unit_cost;

  if (pack_id) {
    const { data: pack } = await supabase
      .from("stock_item_packs")
      .select("size, stock_item_id")
      .eq("id", pack_id)
      .single();

    if (!pack || pack.stock_item_id !== stock_item_id) {
      return { message: "Invalid pack selected." };
    }

    baseQuantity = quantity * pack.size;
    if (unit_cost !== undefined) {
      baseUnitCost = unit_cost / pack.size;
    }
  }

  const { error } = await supabase.from("stock_movements").insert({
    merchant_id: session.merchantId,
    stock_item_id,
    movement_type: "restock",
    quantity_change: baseQuantity,
    unit_cost: baseUnitCost ?? null,
  });

  if (error) return { message: "Failed to record restock." };

  if (baseUnitCost) {
    await supabase
      .from("stock_items")
      .update({ cost_price: baseUnitCost })
      .eq("id", stock_item_id)
      .eq("merchant_id", session.merchantId);
  }

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/stock`);
  redirect(`/${lang}/stock`);
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

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/stock`);
  redirect(`/${lang}/stock`);
}

export const getStockSalesStats = cache(async () => {
  const session = await requireSession();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Start of current week (Monday)
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { data: salesTx } = await supabase
    .from("transactions")
    .select("amount, created_at, type, method")
    .eq("merchant_id", session.merchantId)
    .gte("created_at", startOfMonth);

  const txList = salesTx ?? [];

  const todayTxs = txList.filter(
    (t) => (t.type === "sale" || t.type === "payment") && t.created_at >= startOfToday
  );

  const weekTxs = txList.filter(
    (t) => (t.type === "sale" || t.type === "payment") && t.created_at >= startOfWeek.toISOString()
  );

  const monthTxs = txList.filter((t) => t.type === "sale" || t.type === "payment");

  const salesToday = todayTxs.reduce((sum, t) => sum + t.amount, 0);
  const cashToday = todayTxs
    .filter((t) => !t.method || t.method === "cash")
    .reduce((sum, t) => sum + t.amount, 0);
  const mtnToday = todayTxs
    .filter((t) => t.method === "mtn")
    .reduce((sum, t) => sum + t.amount, 0);
  const orangeToday = todayTxs
    .filter((t) => t.method === "orange")
    .reduce((sum, t) => sum + t.amount, 0);

  const salesWeek = weekTxs.reduce((sum, t) => sum + t.amount, 0);
  const cashWeek = weekTxs
    .filter((t) => !t.method || t.method === "cash")
    .reduce((sum, t) => sum + t.amount, 0);
  const mtnWeek = weekTxs
    .filter((t) => t.method === "mtn")
    .reduce((sum, t) => sum + t.amount, 0);
  const orangeWeek = weekTxs
    .filter((t) => t.method === "orange")
    .reduce((sum, t) => sum + t.amount, 0);

  const salesMonth = monthTxs.reduce((sum, t) => sum + t.amount, 0);
  const cashMonth = monthTxs
    .filter((t) => !t.method || t.method === "cash")
    .reduce((sum, t) => sum + t.amount, 0);
  const mtnMonth = monthTxs
    .filter((t) => t.method === "mtn")
    .reduce((sum, t) => sum + t.amount, 0);
  const orangeMonth = monthTxs
    .filter((t) => t.method === "orange")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    salesToday,
    cashToday,
    mtnToday,
    orangeToday,
    salesWeek,
    cashWeek,
    mtnWeek,
    orangeWeek,
    salesMonth,
    cashMonth,
    mtnMonth,
    orangeMonth,
  };
});
