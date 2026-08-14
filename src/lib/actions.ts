"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMoneyContext, applyDueRecurringPayments } from "@/lib/data";
import { alignRecurringDate, parseAmountToBani, todayISO, toStoredBani } from "@/lib/money";
import { defaultRecurringTitle, nextOccurrence, parseRecurringInterval } from "@/lib/recurring";
import { nextDueAfterPaid } from "@/lib/reminders";
import type { RepeatMonths, TxType } from "@/lib/types";

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

  const money = await getMoneyContext();
  const stored = toStoredBani(amount, money);
  if (stored == null || stored <= 0) {
    return { error: "Could not convert that amount. Try again or switch back to SEK." };
  }

  const payload = {
    type,
    amount_bani: stored,
    category_id,
    date,
    note,
    entered_by: user.id,
  };

  const interval = parseRecurringInterval(String(formData.get("repeat_months") ?? ""));

  if (id) {
    const { error } = await supabase.from("transactions").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert(payload)
      .select("id")
      .single();
    if (error) return { error: error.message };

    if (interval && inserted) {
      const title = note ?? defaultRecurringTitle(type, interval);
      const { data: rule, error: ruleError } = await supabase
        .from("recurring_payments")
        .insert({
          title,
          type,
          amount_bani: stored,
          category_id,
          note,
          interval_months: interval,
          next_date: nextOccurrence(date, interval),
          created_by: user.id,
          active: true,
        })
        .select("id")
        .single();
      if (ruleError) return { error: ruleError.message };
      if (rule) {
        const { error: linkError } = await supabase
          .from("transactions")
          .update({ recurring_payment_id: rule.id })
          .eq("id", inserted.id);
        if (linkError) return { error: linkError.message };
      }
    }
  }

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/recurring");
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
  const currency = String(formData.get("currency") ?? "SEK");
  const { error } = await supabase
    .from("settings")
    .update({ currency, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/family");
  revalidatePath("/add");
  revalidatePath("/settings");
  return {};
}

export async function setSavings(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const userId = String(formData.get("user_id") ?? "");
  const raw = String(formData.get("amount") ?? "").trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(raw);
  if (userId !== user.id) return { error: "You can only edit your own savings." };
  if (!Number.isFinite(n) || n < 0) return { error: "Enter a valid amount (0 or more)." };

  const money = await getMoneyContext();
  const target = toStoredBani(Math.round(n * 100), money);
  if (target == null || target < 0) {
    return { error: "Could not convert that amount. Try again or switch back to SEK." };
  }
  const { data: rows, error: sumError } = await supabase
    .from("savings_movements")
    .select("amount_bani")
    .eq("user_id", userId);
  if (sumError) return { error: sumError.message };

  const current = (rows ?? []).reduce((sum, row) => sum + (row.amount_bani as number), 0);
  const delta = target - current;
  if (delta === 0) return {};

  const { error } = await supabase.from("savings_movements").insert({
    user_id: userId,
    amount_bani: delta,
    note: "Balance edited",
    entered_by: user.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/family");
  revalidatePath("/");
  revalidatePath("/history");
  return {};
}

function parseRepeatMonths(value: string): RepeatMonths | null {
  const n = Number(value);
  if (n === 0 || n === 1 || n === 6 || n === 12) return n;
  return null;
}

function revalidateReminders() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/reminders");
}

function revalidateRecurring() {
  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/recurring");
  revalidatePath("/family");
}

export async function saveRecurringPayment(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "") as TxType;
  const amount = parseAmountToBani(String(formData.get("amount") ?? ""));
  const category_id = String(formData.get("category_id") ?? "") || null;
  const next_date = String(formData.get("next_date") ?? "");
  const interval_months = parseRecurringInterval(String(formData.get("interval_months") ?? "1"));
  const note = String(formData.get("note") ?? "").trim() || null;
  const active = String(formData.get("active") ?? "true") !== "false";

  if (!title) return { error: "Give this payment a name." };
  if (type !== "income" && type !== "expense") {
    return { error: "Choose income or expense." };
  }
  if (!amount) return { error: "Enter a valid amount." };
  if (!next_date) return { error: "Pick the next payment date." };
  if (!interval_months) return { error: "Choose how often this repeats." };

  const alignedNext = alignRecurringDate(next_date, interval_months, todayISO());

  const money = await getMoneyContext();
  const stored = toStoredBani(amount, money);
  if (stored == null || stored <= 0) {
    return { error: "Could not convert that amount. Try again or switch back to SEK." };
  }

  const payload = {
    title,
    type,
    amount_bani: stored,
    category_id,
    note,
    interval_months,
    next_date: alignedNext,
    active,
  };

  if (id) {
    const { error } = await supabase.from("recurring_payments").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("recurring_payments").insert({
      ...payload,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  await applyDueRecurringPayments();
  revalidateRecurring();
  redirect("/recurring");
}

export async function deleteRecurringPayment(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("recurring_payments").delete().eq("id", id);
  if (error) throw error;
  revalidateRecurring();
  redirect("/recurring");
}

export async function saveReminder(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const amount = parseAmountToBani(String(formData.get("amount") ?? ""));
  const category_id = String(formData.get("category_id") ?? "") || null;
  const due_date = String(formData.get("due_date") ?? "");
  const repeat_months = parseRepeatMonths(String(formData.get("repeat_months") ?? "0"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!title) return { error: "Give this reminder a name." };
  if (!amount) return { error: "Enter a valid amount." };
  if (!due_date) return { error: "Pick a due date." };
  if (repeat_months == null) return { error: "Choose how often this repeats." };

  const money = await getMoneyContext();
  const stored = toStoredBani(amount, money);
  if (stored == null || stored <= 0) {
    return { error: "Could not convert that amount. Try again or switch back to SEK." };
  }

  const payload = {
    title,
    amount_bani: stored,
    category_id,
    due_date,
    repeat_months,
    note,
    completed_at: null,
  };

  if (id) {
    const { error } = await supabase.from("reminders").update(payload).eq("id", id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase.from("reminders").insert({
      ...payload,
      created_by: user.id,
    });
    if (error) return { error: error.message };
  }

  revalidateReminders();
  redirect("/reminders");
}

export async function deleteReminder(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
  revalidateReminders();
  redirect("/reminders");
}

export async function markReminderPaid(formData: FormData): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const amount = parseAmountToBani(String(formData.get("amount") ?? ""));
  if (!id) return { error: "Missing reminder." };
  if (!amount) return { error: "Enter a valid amount." };

  const money = await getMoneyContext();
  const stored = toStoredBani(amount, money);
  if (stored == null || stored <= 0) {
    return { error: "Could not convert that amount. Try again or switch back to SEK." };
  }

  const { data: row, error: loadError } = await supabase
    .from("reminders")
    .select("id, title, category_id, due_date, repeat_months, completed_at, note")
    .eq("id", id)
    .maybeSingle();
  if (loadError) return { error: loadError.message };
  if (!row || row.completed_at) return { error: "That reminder is no longer due." };

  const today = todayISO();
  const repeat = Number(row.repeat_months);
  const note = [row.title, row.note].filter(Boolean).join(" — ");

  const { error: txError } = await supabase.from("transactions").insert({
    type: "expense",
    amount_bani: stored,
    category_id: row.category_id,
    date: today,
    note,
    entered_by: user.id,
    reminder_id: id,
  });
  if (txError) return { error: txError.message };

  const update =
    repeat === 0
      ? { completed_at: new Date().toISOString(), amount_bani: stored }
      : {
          due_date: nextDueAfterPaid(row.due_date as string, repeat, today),
          amount_bani: stored,
        };

  const { error: updateError } = await supabase.from("reminders").update(update).eq("id", id);
  if (updateError) return { error: updateError.message };

  revalidateReminders();
  return {};
}
