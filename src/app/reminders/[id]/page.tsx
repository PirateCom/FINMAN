import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ReminderForm } from "@/components/reminder-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ensureProfile,
  getCategories,
  getMoneyContext,
  getReminder,
  getUser,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function EditReminderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const { id } = await params;
  const [reminder, categories, money] = await Promise.all([
    getReminder(id),
    getCategories(),
    getMoneyContext(),
  ]);

  if (!reminder) notFound();

  return (
    <AppShell title="Edit reminder" action={<ThemeToggle />}>
      <ReminderForm categories={categories} money={money} reminder={reminder} />
    </AppShell>
  );
}
