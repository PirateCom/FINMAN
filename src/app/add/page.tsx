import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionForm } from "@/components/transaction-form";
import { ensureProfile, getCategories, getSettings, getUser } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AddPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);

  return (
    <AppShell title="Add" action={<ThemeToggle />}>
      <TransactionForm categories={categories} currency={settings.currency} />
    </AppShell>
  );
}
