"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { CreateOrderSchema, type ActionState } from "@/app/lib/definitions";
import { getLocaleFromCookie } from "@/app/lib/get-locale";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

/**
 * Resolves the customer to attach a debt to: uses the given customer_id if
 * present, otherwise creates a new customer inline from a name (+ optional
 * phone) typed directly into the sale flow — so merchants never have to
 * leave a debt-sale screen just to register a customer that isn't in the
 * list yet.
 */
async function resolveOrCreateCustomer(
  merchantId: string,
  customerId: string | null | undefined,
  newName: string | undefined,
  newPhone: string | undefined
): Promise<{ customerId: string } | { error: string }> {
  if (customerId) return { customerId };

  if (!newName || newName.trim().length === 0) {
    return { error: "Please select a customer or enter a name for a new one." };
  }

  const { data: newCustomer, error } = await supabase
    .from("customers")
    .insert({
      merchant_id: merchantId,
      name: newName.trim(),
      phone: newPhone?.trim() || null,
      balance: 0,
    })
    .select("id")
    .single();

  if (error || !newCustomer) {
    return { error: "Failed to create the new customer." };
  }

  return { customerId: newCustomer.id };
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
  const new_customer_name = (formData.get("new_customer_name") as string) || undefined;
  const new_customer_phone = (formData.get("new_customer_phone") as string) || undefined;
  const sale_type = (formData.get("sale_type") as "sale" | "debt") || "sale";
  const payment_method = (formData.get("payment_method") as "cash" | "mtn" | "orange") || "cash";

  const validated = CreateOrderSchema.safeParse({
    customer_id,
    new_customer_name,
    new_customer_phone,
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

  // If debt sale, resolve (or create) the customer and check max debt limit
  let resolvedCustomerId: string | null = customer_id;
  if (sale_type === "debt") {
    const resolved = await resolveOrCreateCustomer(
      session.merchantId,
      customer_id,
      validated.data.new_customer_name,
      validated.data.new_customer_phone
    );
    if ("error" in resolved) return { message: resolved.error };
    resolvedCustomerId = resolved.customerId;

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
        .eq("id", resolvedCustomerId)
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
      p_customer_id: resolvedCustomerId,
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

    // 5. Record Transaction Log as sale, and link it back to the order so
    // it can be safely voided later if the merchant marks this as debt.
    const { data: newTx } = await supabase
      .from("transactions")
      .insert({
        merchant_id: session.merchantId,
        customer_id: customer_id ?? null,
        type: "sale",
        amount: orderTotal,
        description: `Direct Sale (#${newOrder.id.slice(0, 8)})`,
        method: payment_method,
      })
      .select("id")
      .single();

    if (newTx) {
      await supabase.from("orders").update({ transaction_id: newTx.id }).eq("id", newOrder.id);
    }
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

export const getItemsSoldReport = cache(async (): Promise<ItemSoldRecord[]> => {
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
});

export type PaymentStatsReport = {
  salesToday: number;
  cashToday: number;
  mtnToday: number;
  orangeToday: number;
  salesWeek: number;
  cashWeek: number;
  mtnWeek: number;
  orangeWeek: number;
  salesMonth: number;
  cashMonth: number;
  mtnMonth: number;
  orangeMonth: number;
};

export const getPaymentStatsReport = cache(async (): Promise<PaymentStatsReport> => {
  const session = await requireSession();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(d.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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

  return {
    salesToday: todayTxs.reduce((sum, t) => sum + t.amount, 0),
    cashToday: todayTxs.filter((t) => !t.method || t.method === "cash").reduce((sum, t) => sum + t.amount, 0),
    mtnToday: todayTxs.filter((t) => t.method === "mtn").reduce((sum, t) => sum + t.amount, 0),
    orangeToday: todayTxs.filter((t) => t.method === "orange").reduce((sum, t) => sum + t.amount, 0),

    salesWeek: weekTxs.reduce((sum, t) => sum + t.amount, 0),
    cashWeek: weekTxs.filter((t) => !t.method || t.method === "cash").reduce((sum, t) => sum + t.amount, 0),
    mtnWeek: weekTxs.filter((t) => t.method === "mtn").reduce((sum, t) => sum + t.amount, 0),
    orangeWeek: weekTxs.filter((t) => t.method === "orange").reduce((sum, t) => sum + t.amount, 0),

    salesMonth: monthTxs.reduce((sum, t) => sum + t.amount, 0),
    cashMonth: monthTxs.filter((t) => !t.method || t.method === "cash").reduce((sum, t) => sum + t.amount, 0),
    mtnMonth: monthTxs.filter((t) => t.method === "mtn").reduce((sum, t) => sum + t.amount, 0),
    orangeMonth: monthTxs.filter((t) => t.method === "orange").reduce((sum, t) => sum + t.amount, 0),
  };
});

export type OrderListItem = {
  id: string;
  total_amount: number;
  payment_type: "cash" | "credit" | "mtn" | "orange";
  created_at: string;
  customer: { id: string; name: string } | null;
  item_count: number;
};

// Recent orders for the front-office order list. Capped to a reasonable
// window so this stays fast as history grows — client-side pagination
// (PaginationControls) handles slicing the display.
export const getOrders = cache(async (): Promise<OrderListItem[]> => {
  const session = await requireSession();

  const { data } = await supabase
    .from("orders")
    .select("id, total_amount, payment_type, created_at, customers(id, name), order_items(quantity)")
    .eq("merchant_id", session.merchantId)
    .order("created_at", { ascending: false })
    .limit(500);

  return (data ?? []).map((o) => {
    const customer = o.customers as unknown as { id: string; name: string } | null;
    return {
      id: o.id,
      total_amount: o.total_amount,
      payment_type: o.payment_type,
      created_at: o.created_at,
      customer,
      item_count: (o.order_items ?? []).length,
    };
  });
});

export type OrderDetail = {
  id: string;
  total_amount: number;
  payment_type: "cash" | "credit" | "mtn" | "orange";
  created_at: string;
  customer: { id: string; name: string; phone: string | null } | null;
  items: { name: string; unit: string; quantity: number; unit_price: number }[];
};

export async function getOrderById(orderId: string): Promise<OrderDetail | null> {
  const session = await requireSession();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, total_amount, payment_type, created_at, customers(id, name, phone), order_items(quantity, unit_price, stock_items(name, unit))"
    )
    .eq("id", orderId)
    .eq("merchant_id", session.merchantId)
    .single();

  if (!data) return null;

  const customer = data.customers as unknown as { id: string; name: string; phone: string | null } | null;
  const items = (data.order_items ?? []).map((raw) => {
    const item = raw as unknown as {
      quantity: number;
      unit_price: number;
      stock_items: { name: string; unit: string } | null;
    };
    return {
      name: item.stock_items?.name ?? "Item",
      unit: item.stock_items?.unit ?? "",
      quantity: item.quantity,
      unit_price: item.unit_price,
    };
  });

  return {
    id: data.id,
    total_amount: data.total_amount,
    payment_type: data.payment_type,
    created_at: data.created_at,
    customer,
    items,
  };
}

/**
 * Marks an existing direct-sale order (cash/mtn/orange) as a debt sale:
 * voids the original sale transaction, creates a real debt against the
 * chosen customer, and relinks the order — atomically via the
 * convert_order_to_debt RPC. Refuses if the order is already credit.
 */
export async function setOrderAsDebt(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const orderId = String(formData.get("order_id") ?? "");
  const rawCustomerId = formData.get("customer_id");
  const customerId = rawCustomerId ? String(rawCustomerId) : null;
  const newCustomerName = (formData.get("new_customer_name") as string) || undefined;
  const newCustomerPhone = (formData.get("new_customer_phone") as string) || undefined;

  if (!orderId) {
    return { message: "Order not found." };
  }

  const { data: order } = await supabase
    .from("orders")
    .select("total_amount, payment_type")
    .eq("id", orderId)
    .eq("merchant_id", session.merchantId)
    .single();

  if (!order) return { message: "Order not found." };
  if (order.payment_type === "credit") return { message: "This order is already a debt sale." };

  const resolved = await resolveOrCreateCustomer(session.merchantId, customerId, newCustomerName, newCustomerPhone);
  if ("error" in resolved) return { message: resolved.error };
  const resolvedCustomerId = resolved.customerId;

  const { data: merchantData } = await supabase
    .from("merchants")
    .select("settings")
    .eq("id", session.merchantId)
    .single();

  const maxDebtLimit = Number((merchantData?.settings as Record<string, unknown> | null)?.max_debt_limit ?? 0);

  if (maxDebtLimit > 0) {
    const { data: customer } = await supabase
      .from("customers")
      .select("balance")
      .eq("id", resolvedCustomerId)
      .single();
    const currentBalance = Number(customer?.balance ?? 0);

    if (currentBalance + order.total_amount > maxDebtLimit) {
      return {
        message: `Debt limit exceeded! Maximum allowed debt is ${maxDebtLimit.toLocaleString()} FCFA (current: ${currentBalance.toLocaleString()} FCFA).`,
      };
    }
  }

  const { error } = await supabase.rpc("convert_order_to_debt", {
    p_order_id: orderId,
    p_merchant_id: session.merchantId,
    p_customer_id: resolvedCustomerId,
  });

  if (error) {
    return {
      message: error.message?.includes("already a debt")
        ? "This order is already a debt sale."
        : "Failed to mark order as debt.",
    };
  }

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/orders/${orderId}`);
  revalidatePath(`/${lang}/orders`);
  revalidatePath(`/${lang}/customers/${resolvedCustomerId}`);
  revalidatePath(`/${lang}/customers`);
  revalidatePath(`/${lang}/dashboard`);
  redirect(`/${lang}/orders/${orderId}`);
}
