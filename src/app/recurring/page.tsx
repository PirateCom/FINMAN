import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { RecurringForm } from "@/components/recurring-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  applyDueRecurringPayments,
  ensureProfile,
  getCategories,
  getMoneyContext,
  getRecurringPayments,
  getUser,
} from "@/lib/data";
import { formatStoredMoney, todayISO } from "@/lib/money";
import { recurringIntervalLabel } from "@/lib/recurring";
import { dueLabel } from "@/lib/reminders";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import Link from "next/link";

export default async function RecurringPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  try {
    await applyDueRecurringPayments();
  } catch {
    /* table may be missing on a fresh project */
  }

  const [categories, money, payments] = await Promise.all([
    getCategories(),
    getMoneyContext(),
    getRecurringPayments(),
  ]);
  const today = todayISO();

  return (
    <AppShell title="Automatic" action={<ThemeToggle />}>
      <p className="mb-5 text-sm text-[var(--muted-fg)]">
        Standing payments such as a monthly stock transfer. They are added on the date you set, then repeat by themselves.
      </p>

      <RecurringForm categories={categories} money={money} />

      <div className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Scheduled
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {payments.map((payment) => {
            const income = payment.type === "income";
            return (
              <Link
                key={payment.id}
                href={`/recurring/${payment.id}`}
                className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-3 py-3"
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
                  style={{
                    backgroundColor: payment.category?.color ?? (income ? "#0F766E" : "#1D4ED8"),
                  }}
                >
                  {payment.title.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {payment.title}
                    {!payment.active ? (
                      <span className="ml-2 text-xs font-medium text-[var(--muted-fg)]">paused</span>
                    ) : null}
                  </span>
                  <span className="block truncate text-xs text-[var(--muted-fg)]">
                    {dueLabel(payment.next_date, today)} · {recurringIntervalLabel(payment.interval_months)}
                  </span>
                </span>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    income ? "text-[var(--income)]" : "text-[var(--expense)]"
                  }`}
                >
                  {income ? "+" : "−"}
                  {formatStoredMoney(payment.amount_bani, money)}
                </span>
              </Link>
            );
          })}
          {payments.length === 0 ? (
            <p className="rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
              No automatic payments yet. Add 3 500 kr to stocks every month above.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
