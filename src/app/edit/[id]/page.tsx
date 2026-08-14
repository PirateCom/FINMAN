import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import { TransactionForm } from "@/components/transaction-form";
import {
  ensureProfile,
  getCategories,
  getSettings,
  getTransaction,
  getUser,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const { id } = await params;
  const [tx, categories, settings] = await Promise.all([
    getTransaction(id),
    getCategories(),
    getSettings(),
  ]);

  if (!tx) notFound();

  return (
    <AppShell title="Edit" action={<ThemeToggle />}>
      <TransactionForm
        categories={categories}
        currency={settings.currency}
        transaction={tx}
      />
    </AppShell>
  );
}
