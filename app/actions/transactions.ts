"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { DebtSchema, PaymentSchema, type ActionState } from "@/app/lib/definitions";
import { getLocaleFromCookie } from "@/app/lib/get-locale";

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

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/customers/${customer_id}`);
  revalidatePath(`/${lang}/customers`);
  revalidatePath(`/${lang}/dashboard`);
  redirect(`/${lang}/customers/${customer_id}`);
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

  // Check customer's current balance
  const { data: customer } = await supabase
    .from("customers")
    .select("balance")
    .eq("id", customer_id)
    .eq("merchant_id", session.merchantId)
    .single();

  if (customer && customer.balance > 0 && amount > customer.balance) {
    return {
      errors: {
        amount: [`Payment amount (${amount.toLocaleString()} FCFA) cannot exceed current debt (${customer.balance.toLocaleString()} FCFA).`],
      },
    };
  }

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

  const lang = await getLocaleFromCookie();
  revalidatePath(`/${lang}/customers/${customer_id}`);
  revalidatePath(`/${lang}/customers`);
  revalidatePath(`/${lang}/dashboard`);
  redirect(`/${lang}/customers/${customer_id}`);
}

export async function getDashboardStats(merchantId: string) {
  const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const [customersRes, todayTxRes, monthTxRes] = await Promise.all([
    supabase
      .from("customers")
      .select("balance")
      .eq("merchant_id", merchantId),

    supabase
      .from("transactions")
      .select("amount, type")
      .eq("merchant_id", merchantId)
      .gte("created_at", startOfToday),

    supabase
      .from("transactions")
      .select("amount, type")
      .eq("merchant_id", merchantId)
      .gte("created_at", startOfMonth),
  ]);

  const allCustomers = customersRes.data ?? [];
  const todayTx = todayTxRes.data ?? [];
  const monthTx = monthTxRes.data ?? [];

  const totalOwed = allCustomers.reduce(
    (sum, c) => sum + (c.balance > 0 ? c.balance : 0),
    0
  );

  const salesToday = todayTx
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + t.amount, 0);

  const debtsToday = todayTx
    .filter((t) => t.type === "debt")
    .reduce((sum, t) => sum + t.amount, 0);

  const salesMonth = monthTx
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + t.amount, 0);

  const debtsMonth = monthTx
    .filter((t) => t.type === "debt")
    .reduce((sum, t) => sum + t.amount, 0);

  return { totalOwed, salesToday, debtsToday, salesMonth, debtsMonth };
}
