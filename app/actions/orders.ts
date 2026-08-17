"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { CreateOrderSchema, type ActionState } from "@/app/lib/definitions";
import { getLocaleFromCookie } from "@/app/lib/i18n-config";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

/**
 * Registers an order (list of items + quantities) for a customer.
 * This is the "commande" flow: it auto-creates a debt for the total
 * and deducts stock, atomically, via the create_order_as_debt RPC.
 *
 * Client is expected to submit a hidden "items" field containing
 * JSON.stringify([{ stock_item_id, quantity, unit_price }, ...]).
 */
export async function createOrder(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const rawItems = formData.get("items");
  let parsedItems: unknown;
  try {
    parsedItems = JSON.parse(String(rawItems ?? "[]"));
  } catch {
    return { message: "Invalid order items." };
  }

  const rawCustomerId = formData.get("customer_id");
  const customer_id = rawCustomerId ? String(rawCustomerId) : null;
  const sale_type = (formData.get("sale_type") as "sale" | "debt") || "sale";
  const payment_method = (formData.get("payment_method") as "cash" | "mtn" | "orange") || "cash";

  const validated = CreateOrderSchema.safeParse({
    customer_id,
    sale_type,
    payment_method,
    items: parsedItems,
  });

  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Invalid order." };
  }

  const { items } = validated.data;
  const orderTotal = items.reduce(
    (sum: number, i: { quantity: number; unit_price: number }) => sum + i.quantity * i.unit_price,
    0
  );

  // If debt sale, customer is required and max debt limit must be checked
  if (sale_type === "debt") {
    if (!customer_id) {
      return { message: "Please select a customer for debt credit sales." };
    }

    const { data: merchantData } = await supabase
      .from("merchants")
      .select("settings")
      .eq("id", session.merchantId)
      .single();

    const maxDebtLimit = Number((merchantData?.settings as Record<string, unknown> | null)?.max_debt_limit ?? 0);

    if (maxDebtLimit > 0) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("balance")
        .eq("id", customer_id)
        .single();
      const currentBalance = Number(existingCustomer?.balance ?? 0);

      if (currentBalance + orderTotal > maxDebtLimit) {
        return {
          message: `Debt limit exceeded! Maximum allowed debt is ${maxDebtLimit.toLocaleString()} FCFA (current: ${currentBalance.toLocaleString()} FCFA).`,
        };
      }
    }

    // Call RPC for atomic order + stock deduction + debt balance increment
    const { data: orderId, error } = await supabase.rpc("create_order_as_debt", {
      p_merchant_id: session.merchantId,
      p_customer_id: customer_id,
      p_items: items,
    });

    if (error || !orderId) {
      return {
        message: error?.message?.includes("Insufficient stock")
          ? "Not enough stock for one or more items."
          : "Failed to register debt order.",
      };
    }
  } else {
    // Direct Sale Flow (Cash / MoMo / Orange)
    // 1. Verify stock for all items
    for (const item of items) {
      const { data: stockItem } = await supabase
        .from("stock_items")
        .select("quantity, name")
        .eq("id", item.stock_item_id)
        .eq("merchant_id", session.merchantId)
        .single();

      if (!stockItem || stockItem.quantity < item.quantity) {
        return { message: `Not enough stock for ${stockItem?.name ?? "one or more items"}.` };
      }
    }

    // 2. Deduct stock for items
    for (const item of items) {
      const { data: currentStock } = await supabase
        .from("stock_items")
        .select("quantity")
        .eq("id", item.stock_item_id)
        .single();

      if (currentStock) {
        await supabase
          .from("stock_items")
          .update({ quantity: Math.max(0, currentStock.quantity - item.quantity) })
          .eq("id", item.stock_item_id);
      }
    }

    // 3. Record Order
    const { data: newOrder, error: orderErr } = await supabase
      .from("orders")
      .insert({
        merchant_id: session.merchantId,
        customer_id: customer_id ?? null,
        total_amount: orderTotal,
        payment_type: payment_method,
      })
      .select("id")
      .single();

    if (orderErr || !newOrder) {
      return { message: "Failed to save direct sale." };
    }

    // 4. Record Order Items
    const orderItemsPayload = items.map((i: { stock_item_id: string; quantity: number; unit_price: number }) => ({
      order_id: newOrder.id,
      stock_item_id: i.stock_item_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    await supabase.from("order_items").insert(orderItemsPayload);

    // 5. Record Transaction Log as sale
    await supabase.from("transactions").insert({
      merchant_id: session.merchantId,
      customer_id: customer_id ?? null,
      type: "sale",
      amount: orderTotal,
      description: `Direct Sale (#${newOrder.id.slice(0, 8)})`,
      method: payment_method,
    });
  }

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/transactions`);
  redirect(`/${lang}/transactions`);
}

export const createOrderAsDebt = createOrder;

export async function getOrdersForCustomer(customerId: string) {
  const session = await requireSession();

  const { data } = await supabase
    .from("orders")
    .select("id, total_amount, created_at, order_items(quantity, unit_price, stock_items(name, unit))")
    .eq("customer_id", customerId)
    .eq("merchant_id", session.merchantId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export type ItemSoldRecord = {
  stock_item_id: string;
  name: string;
  unit: string;
  quantityToday: number;
  revenueToday: number;
  quantityWeek: number;
  revenueWeek: number;
  quantityMonth: number;
  revenueMonth: number;
};

export async function getItemsSoldReport(): Promise<ItemSoldRecord[]> {
  const session = await requireSession();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: orders } = await supabase
    .from("orders")
    .select("id, created_at, order_items(quantity, unit_price, stock_item_id, stock_items(id, name, unit))")
    .eq("merchant_id", session.merchantId)
    .gte("created_at", startOfMonth)
    .order("created_at", { ascending: false });

  const itemMap = new Map<string, ItemSoldRecord>();

  for (const order of orders ?? []) {
    const createdAt = order.created_at;
    const isToday = createdAt >= startOfToday;
    const isWeek = createdAt >= startOfWeek.toISOString();
    const isMonth = createdAt >= startOfMonth;

    for (const rawItem of order.order_items ?? []) {
      const item = rawItem as unknown as {
        quantity: number;
        unit_price: number;
        stock_item_id: string;
        stock_items: { id: string; name: string; unit: string } | null;
      };
      if (!item.stock_items) continue;

      const id = item.stock_items.id;
      const existing: ItemSoldRecord = itemMap.get(id) ?? {
        stock_item_id: id,
        name: item.stock_items.name,
        unit: item.stock_items.unit,
        quantityToday: 0,
        revenueToday: 0,
        quantityWeek: 0,
        revenueWeek: 0,
        quantityMonth: 0,
        revenueMonth: 0,
      };

      const revenue = item.quantity * item.unit_price;

      if (isToday) {
        existing.quantityToday += item.quantity;
        existing.revenueToday += revenue;
      }
      if (isWeek) {
        existing.quantityWeek += item.quantity;
        existing.revenueWeek += revenue;
      }
      if (isMonth) {
        existing.quantityMonth += item.quantity;
        existing.revenueMonth += revenue;
      }

      itemMap.set(id, existing);
    }
  }

  return Array.from(itemMap.values());
}
