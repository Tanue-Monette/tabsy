"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import type { OfflineSyncItem } from "@/app/lib/db";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function processOfflineQueueItem(
  item: OfflineSyncItem
): Promise<{ success: boolean; message?: string }> {
  try {
    const session = await requireSession();
    const { type, payload } = item;

    const { data: merchantData } = await supabase
      .from("merchants")
      .select("settings")
      .eq("id", session.merchantId)
      .single();

    const maxDebtLimit = Number((merchantData?.settings as Record<string, unknown> | null)?.max_debt_limit ?? 0);

    if (type === "add_debt_with_customer") {
      let resolvedCustomerId = payload.customer_id;

      if (!resolvedCustomerId && payload.new_name) {
        const { data: newCustomer, error: createError } = await supabase
          .from("customers")
          .insert({
            merchant_id: session.merchantId,
            name: payload.new_name,
            phone: payload.new_phone ?? null,
            balance: 0,
          })
          .select("id")
          .single();

        if (createError || !newCustomer) {
          return { success: false, message: "Failed to create customer during sync." };
        }
        resolvedCustomerId = newCustomer.id;
      }

      if (!resolvedCustomerId) {
        return { success: false, message: "Missing customer identifier." };
      }

      if (maxDebtLimit > 0) {
        const { data: custData } = await supabase
          .from("customers")
          .select("balance")
          .eq("id", resolvedCustomerId)
          .single();
        const currentBal = Number(custData?.balance ?? 0);
        if (currentBal + payload.amount > maxDebtLimit) {
          return { success: false, message: `Debt limit exceeded (${maxDebtLimit.toLocaleString()} FCFA max)` };
        }
      }

      const { error: txError } = await supabase.from("transactions").insert({
        merchant_id: session.merchantId,
        customer_id: resolvedCustomerId,
        type: "debt",
        amount: payload.amount,
        description: payload.description ?? null,
        method: null,
      });

      if (txError) return { success: false, message: "Failed to insert debt transaction." };

      const { error: balError } = await supabase.rpc("increment_balance", {
        p_customer_id: resolvedCustomerId,
        p_amount: payload.amount,
      });

      if (balError) return { success: false, message: "Balance update failed." };

      revalidatePath(`/customers/${resolvedCustomerId}`);
    } else if (type === "debt") {
      if (!payload.customer_id) {
        return { success: false, message: "Missing customer_id." };
      }

      if (maxDebtLimit > 0) {
        const { data: custData } = await supabase
          .from("customers")
          .select("balance")
          .eq("id", payload.customer_id)
          .single();
        const currentBal = Number(custData?.balance ?? 0);
        if (currentBal + payload.amount > maxDebtLimit) {
          return { success: false, message: `Debt limit exceeded (${maxDebtLimit.toLocaleString()} FCFA max)` };
        }
      }

      const { error: txError } = await supabase.from("transactions").insert({
        merchant_id: session.merchantId,
        customer_id: payload.customer_id,
        type: "debt",
        amount: payload.amount,
        description: payload.description ?? null,
        method: null,
      });

      if (txError) return { success: false, message: "Failed to insert debt transaction." };

      const { error: balError } = await supabase.rpc("increment_balance", {
        p_customer_id: payload.customer_id,
        p_amount: payload.amount,
      });

      if (balError) return { success: false, message: "Balance update failed." };

      revalidatePath(`/customers/${payload.customer_id}`);
    } else if (type === "payment") {
      if (!payload.customer_id) {
        return { success: false, message: "Missing customer_id." };
      }

      const { error: txError } = await supabase.from("transactions").insert({
        merchant_id: session.merchantId,
        customer_id: payload.customer_id,
        type: "payment",
        amount: payload.amount,
        description: payload.reference ?? null,
        method: payload.method ?? "cash",
      });

      if (txError) return { success: false, message: "Failed to insert payment transaction." };

      const { error: balError } = await supabase.rpc("increment_balance", {
        p_customer_id: payload.customer_id,
        p_amount: -payload.amount,
      });

      if (balError) return { success: false, message: "Balance update failed." };

      revalidatePath(`/customers/${payload.customer_id}`);
    } else if (type === "order") {
      if (!payload.items || payload.items.length === 0) {
        return { success: false, message: "Order has no items." };
      }

      if (payload.customer_id) {
        // Debt sale flow
        const { data: orderId, error: orderError } = await supabase.rpc("create_order_as_debt", {
          p_merchant_id: session.merchantId,
          p_customer_id: payload.customer_id,
          p_items: payload.items.map((i) => ({
            stock_item_id: i.stock_item_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
        });

        if (orderError || !orderId) {
          return {
            success: false,
            message: orderError?.message?.includes("Insufficient stock")
              ? "Not enough stock for one or more items."
              : "Failed to register debt order during sync.",
          };
        }
        revalidatePath(`/customers/${payload.customer_id}`);
      } else {
        // Direct cash/MoMo sale flow
        const orderTotal = payload.amount;
        const paymentMethod = payload.method ?? "cash";

        // Deduct stock relative delta
        for (const item of payload.items) {
          const { data: currentStock } = await supabase
            .from("stock_items")
            .select("quantity")
            .eq("id", item.stock_item_id)
            .eq("merchant_id", session.merchantId)
            .single();

          if (currentStock) {
            await supabase
              .from("stock_items")
              .update({ quantity: Math.max(0, currentStock.quantity - item.quantity) })
              .eq("id", item.stock_item_id);
          }
        }

        // Insert order record
        const { data: newOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            merchant_id: session.merchantId,
            customer_id: null,
            total_amount: orderTotal,
            payment_type: paymentMethod,
          })
          .select("id")
          .single();

        if (orderErr || !newOrder) {
          return { success: false, message: "Failed to save offline direct sale." };
        }

        // Insert order items
        const stockItemIds = payload.items.map((i) => i.stock_item_id);
        const { data: stockCosts } = await supabase
          .from("stock_items")
          .select("id, cost_price")
          .in("id", stockItemIds);

        const costMap = new Map((stockCosts ?? []).map((s) => [s.id, s.cost_price]));

        const orderItemsPayload = payload.items.map((i) => ({
          order_id: newOrder.id,
          stock_item_id: i.stock_item_id,
          quantity: i.quantity,
          unit_price: i.unit_price,
          cost_price_at_sale: costMap.get(i.stock_item_id) ?? 0,
        }));

        await supabase.from("order_items").insert(orderItemsPayload);

        // Insert transaction record
        const { data: newTx } = await supabase
          .from("transactions")
          .insert({
            merchant_id: session.merchantId,
            customer_id: null,
            type: "sale",
            amount: orderTotal,
            description: `Direct Sale (#${newOrder.id.slice(0, 8)}) [Offline Sync]`,
            method: paymentMethod,
          })
          .select("id")
          .single();

        if (newTx) {
          await supabase.from("orders").update({ transaction_id: newTx.id }).eq("id", newOrder.id);
        }
      }

      revalidatePath("/stock");
      revalidatePath("/transactions");
    }

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during sync.";
    return { success: false, message };
  }
}
