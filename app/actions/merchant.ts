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

  const settings = {
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
}
