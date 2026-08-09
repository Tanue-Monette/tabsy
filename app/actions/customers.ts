"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { CustomerSchema, type ActionState } from "@/app/lib/definitions";
import { z } from "zod";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export async function getCustomers() {
  const session = await requireSession();

  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, balance")
    .eq("merchant_id", session.merchantId)
    .order("name");

  return data ?? [];
}

export async function getCustomer(customerId: string) {
  const session = await requireSession();

  const { data } = await supabase
    .from("customers")
    .select("id, name, phone, balance, created_at")
    .eq("id", customerId)
    .eq("merchant_id", session.merchantId)
    .single();

  return data ?? null;
}

export async function getCustomerTransactions(customerId: string) {
  const session = await requireSession();

  const { data } = await supabase
    .from("transactions")
    .select("id, type, amount, description, method, created_at")
    .eq("customer_id", customerId)
    .eq("merchant_id", session.merchantId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

// Unified action: creates customer if new, then records debt
const AddDebtSchema = z.object({
  // Either an existing customer_id OR a new customer name+phone
  customer_id: z.string().optional(),
  new_name: z.string().trim().optional(),
  new_phone: z.string().trim().optional(),
  amount: z.coerce.number().positive("Amount must be positive"),
  description: z.string().trim().optional(),
});

export async function addDebtWithCustomer(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const raw = {
    customer_id: formData.get("customer_id") as string || undefined,
    new_name: formData.get("new_name") as string || undefined,
    new_phone: formData.get("new_phone") as string || undefined,
    amount: formData.get("amount"),
    description: formData.get("description"),
  };

  const validated = AddDebtSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { customer_id, new_name, new_phone, amount, description } = validated.data;

  // Must have either an existing customer or a new name
  if (!customer_id && !new_name) {
    return { errors: { new_name: ["Please select a customer or enter a name."] } };
  }

  let resolvedCustomerId = customer_id;

  // New customer — create them first
  if (!customer_id && new_name) {
    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        merchant_id: session.merchantId,
        name: new_name,
        phone: new_phone ?? null,
        balance: 0,
      })
      .select("id")
      .single();

    if (createError || !newCustomer) {
      return { message: "Failed to create customer." };
    }

    resolvedCustomerId = newCustomer.id;
  }

  // Record the debt transaction
  const { error: txError } = await supabase.from("transactions").insert({
    merchant_id: session.merchantId,
    customer_id: resolvedCustomerId,
    type: "debt",
    amount,
    description: description ?? null,
    method: null,
  });

  if (txError) return { message: "Failed to record debt." };

  // Update customer balance
  const { error: balError } = await supabase.rpc("increment_balance", {
    p_customer_id: resolvedCustomerId,
    p_amount: amount,
  });

  if (balError) return { message: "Debt recorded but balance update failed." };

  revalidatePath(`/customers/${resolvedCustomerId}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/customers/${resolvedCustomerId}`);
}
