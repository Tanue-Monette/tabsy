"use server";

import { redirect } from "next/navigation";
import { hashSync, verifySync } from "@node-rs/bcrypt";
import { supabase } from "@/app/lib/supabase";
import { createSession, deleteSession } from "@/app/lib/session";
import { RegisterSchema, LoginSchema, type ActionState } from "@/app/lib/definitions";
import { defaultLocale } from "@/app/lib/i18n-config";

export async function register(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const lang = (formData.get("lang") as string) || defaultLocale;

  const raw = {
    shop_name: formData.get("shop_name"),
    merchant_name: formData.get("merchant_name"),
    phone: formData.get("phone"),
    pin: formData.get("pin"),
  };

  const validated = RegisterSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { shop_name, merchant_name, phone, pin } = validated.data;

  const { data: existing } = await supabase
    .from("merchants")
    .select("id")
    .eq("phone", phone)
    .single();

  if (existing) {
    return { errors: { phone: ["This phone number is already registered."] } };
  }

  const pin_hash = hashSync(pin, 12);

  const { data: merchant, error } = await supabase
    .from("merchants")
    .insert({ shop_name, merchant_name, phone, pin_hash })
    .select("id")
    .single();

  if (error || !merchant) {
    return { message: "Failed to create account. Please try again." };
  }

  await createSession(merchant.id);
  redirect(`/${lang}/dashboard`);
}

export async function login(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const lang = (formData.get("lang") as string) || defaultLocale;

  const raw = {
    phone: formData.get("phone"),
    pin: formData.get("pin"),
  };

  const validated = LoginSchema.safeParse(raw);
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { phone, pin } = validated.data;

  const { data: merchant } = await supabase
    .from("merchants")
    .select("id, pin_hash")
    .eq("phone", phone)
    .single();

  if (!merchant) {
    return { message: "Invalid phone number or PIN." };
  }

  const pinMatch = verifySync(pin, merchant.pin_hash);
  if (!pinMatch) {
    return { message: "Invalid phone number or PIN." };
  }

  await createSession(merchant.id);
  redirect(`/${lang}/dashboard`);
}

export async function logout(langOrFormData?: string | FormData): Promise<void> {
  const lang = typeof langOrFormData === "string" ? langOrFormData : defaultLocale;
  await deleteSession();
  redirect(`/${lang}`);
}
