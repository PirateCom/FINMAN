import { createClient } from "@/lib/supabase/server";
import { loadFxSnapshot } from "@/lib/fx-server";
import { monthBounds, todayISO, type MoneyContext } from "@/lib/money";
import { dueSoonUntilISO } from "@/lib/reminders";
import type { Category, Profile, Reminder, RepeatMonths, Settings, Transaction, TxType } from "@/lib/types";

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function ensureProfile(userId: string, email: string | undefined) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, display_name")
    .eq("id", userId)
    .maybeSingle();

  if (data) return data as Profile;

  const display_name = email?.split("@")[0] || "Family member";
  const { data: inserted, error } = await supabase
    .from("users")
    .insert({ id: userId, email: email ?? null, display_name })
    .select("id, email, display_name")
    .single();

  if (error) throw error;
  return inserted as Profile;
}

export async function getSettings(): Promise<Settings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("id, currency, base_currency")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (data) {
    return {
      id: data.id as number,
      currency: (data.currency as string) || "SEK",
      base_currency: (data.base_currency as string) || "SEK",
    };
  }

  const { data: inserted, error: insertError } = await supabase
    .from("settings")
    .insert({ id: 1, currency: "SEK", base_currency: "SEK" })
    .select("id, currency, base_currency")
    .single();

  if (insertError) throw insertError;
  return {
    id: inserted.id as number,
    currency: (inserted.currency as string) || "SEK",
    base_currency: (inserted.base_currency as string) || "SEK",
  };
}

export async function getMoneyContext(): Promise<MoneyContext> {
  const settings = await getSettings();
  const base = settings.base_currency || "SEK";
  const display = settings.currency || "SEK";
  if (base === display) return { base, display, fx: null };

  try {
    const fx = await loadFxSnapshot();
    return { base, display, fx };
  } catch {
    return { base, display, fx: null };
  }
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, type, color")
    .order("type")
    .order("name");

  if (error) throw error;
  return (data ?? []) as Category[];
}

export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, display_name")
    .order("display_name");

  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function getTransactions(opts: {
  year: number;
  month: number;
  type?: TxType | "all";
}): Promise<Transaction[]> {
  const supabase = await createClient();
  const { start, end } = monthBounds(opts.year, opts.month);

  let query = supabase
    .from("transactions")
    .select(
      "id, type, amount_bani, category_id, date, note, entered_by, created_at, category:categories(id, name, type, color), profile:users!entered_by(display_name)",
    )
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts.type && opts.type !== "all") {
    query = query.eq("type", opts.type);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map(normalizeTransaction);
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, type, amount_bani, category_id, date, note, entered_by, created_at, category:categories(id, name, type, color), profile:users!entered_by(display_name)",
    )
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(normalizeTransaction);
}

export function byPerson(transactions: Transaction[], userId: string) {
  return transactions.filter((tx) => tx.entered_by === userId);
}

export function parseScope(value: string | undefined): "family" | "you" {
  return value === "you" ? "you" : "family";
}

export async function getTransaction(id: string): Promise<Transaction | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, type, amount_bani, category_id, date, note, entered_by, created_at, category:categories(id, name, type, color), profile:users!entered_by(display_name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeTransaction(data);
}

function normalizeTransaction(row: Record<string, unknown>): Transaction {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  return {
    id: row.id as string,
    type: row.type as TxType,
    amount_bani: row.amount_bani as number,
    category_id: (row.category_id as string | null) ?? null,
    date: row.date as string,
    note: (row.note as string | null) ?? null,
    entered_by: row.entered_by as string,
    created_at: row.created_at as string,
    category: (category as Category | null) ?? null,
    profile: (profile as { display_name: string } | null) ?? null,
  };
}

export async function getSavingsByUser(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_movements")
    .select("user_id, amount_bani");

  if (error) throw error;

  const totals: Record<string, number> = {};
  for (const row of data ?? []) {
    const id = row.user_id as string;
    totals[id] = (totals[id] ?? 0) + (row.amount_bani as number);
  }
  return totals;
}

export function monthTotals(transactions: Transaction[]) {
  let income = 0;
  let expense = 0;
  for (const tx of transactions) {
    if (tx.type === "income") income += tx.amount_bani;
    else expense += tx.amount_bani;
  }
  return { income, expense, net: income - expense };
}

const reminderSelect =
  "id, title, amount_bani, category_id, due_date, repeat_months, note, created_by, completed_at, created_at, updated_at, category:categories(id, name, type, color)";

function normalizeReminder(row: Record<string, unknown>): Reminder {
  const category = Array.isArray(row.category) ? row.category[0] : row.category;
  const repeat = Number(row.repeat_months);
  const repeat_months: RepeatMonths =
    repeat === 1 || repeat === 6 || repeat === 12 ? repeat : 0;
  return {
    id: row.id as string,
    title: row.title as string,
    amount_bani: row.amount_bani as number,
    category_id: (row.category_id as string | null) ?? null,
    due_date: row.due_date as string,
    repeat_months,
    note: (row.note as string | null) ?? null,
    created_by: row.created_by as string,
    completed_at: (row.completed_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    category: (category as Category | null) ?? null,
  };
}

export async function getReminders(): Promise<Reminder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(reminderSelect)
    .is("completed_at", null)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeReminder(row as Record<string, unknown>));
}

export async function getDueReminders(): Promise<Reminder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(reminderSelect)
    .is("completed_at", null)
    .lte("due_date", dueSoonUntilISO(todayISO()))
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => normalizeReminder(row as Record<string, unknown>));
}

export async function getReminder(id: string): Promise<Reminder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select(reminderSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return normalizeReminder(data as Record<string, unknown>);
}
