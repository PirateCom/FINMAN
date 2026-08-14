"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseAmountToBani } from "@/lib/money";
import type { TxType } from "@/lib/types";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  return { supabase, user };
}

export async function signIn(formData: FormData): Promise<{ error?: string }> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username) return { error: "Username is required." };
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 6) return { error: "Password must be at least 6 characters." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: username },
    },
  });
  if (error) return { error: error.message };

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError) {
      return {
        error:
          "Account created, but you are not logged in. In Supabase go to Authentication → Providers → Email and turn off Confirm email.",
      };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { error: profileError } = await supabase.from("users").upsert({
      id: user.id,
      email: user.email,
      display_name: username,
    });
    if (profileError) return { error: profileError.message };
  }

  redirect("/");
}

export async function saveTransaction(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const type = String(formData.get("type") ?? "") as TxType;
  const amount = parseAmountToBani(String(formData.get("amount") ?? ""));
  const category_id = String(formData.get("category_id") ?? "") || null;
  const date = String(formData.get("date") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (type !== "income" && type !== "expense") {
    return { error: "Choose income or expense." };
  }
  if (!amount) return { error: "Enter a valid amount." };
  if (!date) return { error: "Pick a date." };

  const payload = {
    type,
    amount_bani: amount,
    category_id,
    date,
    note,
    entered_by: user.id,
  };

  if (id) {
    const { error } = await supabase.from("transactions").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("transactions").insert(payload);
    if (error) return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/history");
  redirect("/history");
}

export async function deleteTransaction(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("transactions").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/history");
  redirect("/history");
}

export async function addCategory(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TxType;
  const color = String(formData.get("color") ?? "#78716C");

  if (!name) return { error: "Category name is required." };
  if (type !== "income" && type !== "expense") {
    return { error: "Choose income or expense." };
  }

  const { error } = await supabase.from("categories").insert({
    name,
    type,
    color,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/add");
  revalidatePath("/settings");
  return {};
}

export async function updateDisplayName(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) return { error: "Name cannot be empty." };

  const { error } = await supabase
    .from("users")
    .update({ display_name })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/");
  return {};
}

export async function updateCurrency(formData: FormData): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const currency = String(formData.get("currency") ?? "RON");
  const { error } = await supabase
    .from("settings")
    .update({ currency, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/settings");
  return {};
}
