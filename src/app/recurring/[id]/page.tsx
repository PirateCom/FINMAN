import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BackButton } from "@/components/back-button";
import { RecurringForm } from "@/components/recurring-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ensureProfile,
  getCategories,
  getMoneyContext,
  getRecurringPayment,
  getUser,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function EditRecurringPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const { id } = await params;
  const [payment, categories, money] = await Promise.all([
    getRecurringPayment(id),
    getCategories(),
    getMoneyContext(),
  ]);

  if (!payment) notFound();

  return (
    <AppShell title="Edit automatic" back={<BackButton fallback="/recurring" />} action={<ThemeToggle />}>
      <RecurringForm categories={categories} money={money} payment={payment} />
    </AppShell>
  );
}
