"use server";

import { supabase } from "@/app/lib/supabase";

export type SystemEvent = {
  actor_type: "admin" | "merchant" | "system";
  actor_id?: string;
  actor_label?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: any;
};

export async function logSystemEvent(event: SystemEvent) {
  // Fire and forget, don't wait for it unless necessary, but await is safer
  const { error } = await supabase.from("system_logs").insert([event]);
  if (error) {
    console.error("Failed to log system event", error, event);
  }
}

export async function getSystemLogs(limit = 100, actor_type?: string) {
  let query = supabase
    .from("system_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (actor_type) {
    query = query.eq("actor_type", actor_type);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data;
}
