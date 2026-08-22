"use server";

import { revalidatePath } from "next/cache";
import { supabase } from "../../lib/supabase";
import { logSystemEvent } from "./logs";
import { getAdminSession } from "../../lib/admin-session";

export async function getSystemConfig() {
  const { data, error } = await supabase.from("system_config").select("*");
  if (error || !data) return {};

  const config: Record<string, any> = {};
  for (const item of data) {
    config[item.key] = item.value;
  }
  return config;
}

export async function updateSystemConfig(key: string, value: string | boolean | number) {
  const session = await getAdminSession();
  if (!session) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("system_config")
    .upsert({
      key,
      value,
      updated_at: new Date().toISOString(),
      updated_by: session.adminId,
    });

  if (error) throw new Error("Failed to update config");

  await logSystemEvent({
    actor_type: "admin",
    actor_id: session.adminId,
    action: "update_config",
    entity_type: "config",
    metadata: { key, value },
  });

  revalidatePath("/admin/config");
}
