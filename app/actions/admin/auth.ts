"use server";

import { redirect } from "next/navigation";
import { hashSync, verifySync } from "@node-rs/bcrypt";
import { supabase } from "@/app/lib/supabase";
import { createAdminSession, deleteAdminSession } from "@/app/lib/admin-session";
import { AdminLoginSchema, type ActionState } from "@/app/lib/definitions";

export async function adminLogin(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = AdminLoginSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  // Auto-seed default admin if table is empty
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true });

  if (count === 0 && email === "admin@tabsy.com" && password === "AdminPass123!") {
    const password_hash = hashSync(password, 12);
    await supabase.from("admin_users").insert({
      email,
      password_hash,
      role: "super_admin",
      name: "Super Admin",
    });
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, password_hash, role")
    .eq("email", email)
    .single();

  console.log("login admin: ", admin)

  if (!admin) {
    return { message: "Invalid email or password." };
  }

  const passwordMatch = verifySync(password, admin.password_hash);
  if (!passwordMatch) {
    return { message: "Invalid email or password." };
  }

  await createAdminSession(admin.id, admin.role as "super_admin" | "admin");
  redirect(`/admin`);
}

export async function adminLogout(): Promise<void> {
  await deleteAdminSession();
  redirect(`/admin/login`);
}
