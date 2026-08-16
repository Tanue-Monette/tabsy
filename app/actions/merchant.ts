"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "@/app/lib/supabase";
import { getSession } from "@/app/lib/session";
import { redirect } from "next/navigation";

async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/");
  return session;
}

export async function getMerchant() {
  const session = await requireSession();

  const { data, error } = await supabase
    .from("merchants")
    .select("id, shop_name, merchant_name, phone, settings")
    .eq("id", session.merchantId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function updateSettings(formData: FormData) {
  const session = await requireSession();

  const rawMaxDebt = formData.get("max_debt_limit");
  const max_debt_limit = rawMaxDebt ? Number(rawMaxDebt) : 0;

  const { data: existingMerchant } = await supabase
    .from("merchants")
    .select("settings")
    .eq("id", session.merchantId)
    .single();

  const prevSettings = (existingMerchant?.settings as Record<string, any>) ?? {};

  const settings = {
    ...prevSettings,
    max_debt_limit: isNaN(max_debt_limit) || max_debt_limit < 0 ? 0 : max_debt_limit,
    cash_enabled: formData.get("cash_enabled") === "on",
    mtn_enabled: formData.get("mtn_enabled") === "on",
    orange_enabled: formData.get("orange_enabled") === "on",
    debt_reminders: formData.get("debt_reminders") === "on",
    weekly_reports: formData.get("weekly_reports") === "on",
  };

  const { error } = await supabase
    .from("merchants")
    .update({ settings })
    .eq("id", session.merchantId);

  if (error) return { message: "Failed to save settings." };

  revalidatePath("/settings");
  revalidatePath("/customers");
  revalidatePath("/add-debt");
  revalidatePath("/dashboard");
}
