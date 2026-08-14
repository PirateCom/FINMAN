import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionForm } from "@/components/transaction-form";
import { ensureProfile, getCategories, getMoneyContext, getUser } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AddPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const [categories, money] = await Promise.all([getCategories(), getMoneyContext()]);

  return (
    <AppShell title="Add" back={<BackButton />} action={<ThemeToggle />}>
      <TransactionForm categories={categories} money={money} />
    </AppShell>
  );
}
