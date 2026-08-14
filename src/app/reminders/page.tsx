import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ReminderForm } from "@/components/reminder-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ensureProfile,
  getCategories,
  getMoneyContext,
  getReminders,
  getUser,
} from "@/lib/data";
import { formatStoredMoney, todayISO } from "@/lib/money";
import { dueLabel, repeatLabel } from "@/lib/reminders";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function RemindersPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const [categories, money, reminders] = await Promise.all([
    getCategories(),
    getMoneyContext(),
    getReminders(),
  ]);
  const today = todayISO();

  return (
    <AppShell title="Reminders" action={<ThemeToggle />}>
      <p className="mb-5 text-sm text-[var(--muted-fg)]">
        Track insurance, ITP, and anything else you need to pay. Marking paid on Home adds the expense.
      </p>

      <ReminderForm categories={categories} money={money} />

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Active
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {reminders.map((reminder) => {
            const overdue = reminder.due_date < today;
            return (
              <Link
                key={reminder.id}
                href={`/reminders/${reminder.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-3 py-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{ backgroundColor: reminder.category?.color ?? "#4C5C68" }}
                >
                  {reminder.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{reminder.title}</span>
                  <span
                    className={`block truncate text-xs ${
                      overdue ? "text-[var(--expense)]" : "text-[var(--muted-fg)]"
                    }`}
                  >
                    {dueLabel(reminder.due_date, today)} · {repeatLabel(reminder.repeat_months)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold">
                  {formatStoredMoney(reminder.amount_bani, money)}
                </span>
              </Link>
            );
          })}
          {reminders.length === 0 ? (
            <p className="rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
              No reminders yet. Use a preset above or add a custom one.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
