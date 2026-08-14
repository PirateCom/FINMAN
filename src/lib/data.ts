import { createClient } from "@/lib/supabase/server";
import { monthBounds } from "@/lib/money";
import type { Category, Profile, Settings, Transaction, TxType } from "@/lib/types";

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
    .select("id, currency")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (data) return data as Settings;

  const { data: inserted, error: insertError } = await supabase
    .from("settings")
    .insert({ id: 1, currency: "SEK" })
    .select("id, currency")
    .single();

  if (insertError) throw insertError;
  return inserted as Settings;
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
