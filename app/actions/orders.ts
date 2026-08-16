"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { CreateOrderSchema, type ActionState } from "@/app/lib/definitions";

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
export async function createOrderAsDebt(
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

  const validated = CreateOrderSchema.safeParse({
    customer_id: formData.get("customer_id"),
    items: parsedItems,
  });

  if (!validated.success) {
    return { message: validated.error.issues[0]?.message ?? "Invalid order." };
  }

  const { customer_id, items } = validated.data;

  // Optional: enforce the merchant's max debt limit before submitting,
  // same check as addDebtWithCustomer in customers.ts
  const orderTotal = items.reduce(
    (sum: number, i: { quantity: number; unit_price: number }) => sum + i.quantity * i.unit_price,
    0
  );

  const { data: merchantData } = await supabase
    .from("merchants")
    .select("settings")
    .eq("id", session.merchantId)
    .single();

  const maxDebtLimit = Number(merchantData?.settings?.max_debt_limit ?? 0);

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

  const { data: orderId, error } = await supabase.rpc("create_order_as_debt", {
    p_merchant_id: session.merchantId,
    p_customer_id: customer_id,
    p_items: items,
  });

  if (error || !orderId) {
    // The RPC raises on insufficient stock — surface that message directly
    return {
      message:
        error?.message?.includes("Insufficient stock")
          ? "Not enough stock for one or more items."
          : "Failed to register order.",
    };
  }

  revalidatePath(`/customers/${customer_id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  redirect(`/customers/${customer_id}`);
}

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
