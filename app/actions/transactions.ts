"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { DebtSchema, PaymentSchema, type ActionState } from "@/app/lib/definitions";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export async function addDebt(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = DebtSchema.safeParse({
    customer_id: formData.get("customer_id"),
    amount: formData.get("amount"),
    description: formData.get("description"),
    date: formData.get("date"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { customer_id, amount, description } = validated.data;

  // Insert transaction
  const { error: txError } = await supabase.from("transactions").insert({
    merchant_id: session.merchantId,
    customer_id,
    type: "debt",
    amount,
    description: description ?? null,
    method: null,
  });

  if (txError) return { message: "Failed to record debt." };

  // Increment customer balance
  const { error: balError } = await supabase.rpc("increment_balance", {
    p_customer_id: customer_id,
    p_amount: amount,
  });

  if (balError) return { message: "Debt recorded but balance update failed." };

  revalidatePath(`/customers/${customer_id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/customers/${customer_id}`);
}

export async function recordPayment(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await requireSession();

  const validated = PaymentSchema.safeParse({
    customer_id: formData.get("customer_id"),
    amount: formData.get("amount"),
    method: formData.get("method"),
    reference: formData.get("reference"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { customer_id, amount, method, reference } = validated.data;

  const { error: txError } = await supabase.from("transactions").insert({
    merchant_id: session.merchantId,
    customer_id,
    type: "payment",
    amount,
    description: reference ?? null,
    method,
  });

  if (txError) return { message: "Failed to record payment." };

  // Decrement customer balance
  const { error: balError } = await supabase.rpc("increment_balance", {
    p_customer_id: customer_id,
    p_amount: -amount,
  });

  if (balError) return { message: "Payment recorded but balance update failed." };

  revalidatePath(`/customers/${customer_id}`);
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  redirect(`/customers/${customer_id}`);
}

export async function getDashboardStats(merchantId: string) {
  const [customersRes, todayRes, monthRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, name, phone, balance")
      .eq("merchant_id", merchantId)
      .order("balance", { ascending: false })
      .limit(3),

    supabase
      .from("transactions")
      .select("amount")
      .eq("merchant_id", merchantId)
      .eq("type", "payment")
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

    supabase
      .from("transactions")
      .select("amount, type")
      .eq("merchant_id", merchantId)
      .gte(
        "created_at",
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
      ),
  ]);

  const topDebtors = customersRes.data ?? [];
  const todayPayments = todayRes.data ?? [];
  const monthTx = monthRes.data ?? [];

  const totalOwed = topDebtors.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );

  const paymentsToday = todayPayments.reduce((sum, t) => sum + t.amount, 0);

  const monthlyCollected = monthTx
    .filter((t) => t.type === "payment")
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyDebts = monthTx
    .filter((t) => t.type === "debt")
    .reduce((sum, t) => sum + t.amount, 0);

  return { topDebtors, totalOwed, paymentsToday, monthlyCollected, monthlyDebts };
}
