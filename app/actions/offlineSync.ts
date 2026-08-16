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
    }

    revalidatePath("/customers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unexpected error occurred during sync.";
    return { success: false, message };
  }
}
