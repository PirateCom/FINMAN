import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { DueReminders } from "@/components/due-reminders";
import { ScopeToggle } from "@/components/scope-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalsCard } from "@/components/totals-card";
import { TransactionRow } from "@/components/transaction-row";
import { UpcomingRecurring } from "@/components/upcoming-recurring";
import {
  applyDueRecurringPayments,
  byPerson,
  ensureProfile,
  getAllTransactions,
  getDueReminders,
  getMoneyContext,
  getTransactions,
  getUpcomingRecurring,
  getUser,
  monthTotals,
  parseScope,
} from "@/lib/data";
import { monthLabel, parseMonthParam, type MoneyContext } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { RecurringPayment, Reminder, Transaction } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(user.id, user.email);
  const q = await searchParams;
  const scope = parseScope(q.scope);
  const { year, month } = parseMonthParam(undefined);
  let monthTx: Transaction[] = [];
  let allTx: Transaction[] = [];
  let dueReminders: Reminder[] = [];
  let upcomingRecurring: RecurringPayment[] = [];
  let money: MoneyContext = { base: "SEK", display: "SEK", fx: null };
  let loadError: string | null = null;

  try {
    await applyDueRecurringPayments();
    const [monthData, allData, moneyContext, due, upcoming] = await Promise.all([
      getTransactions({ year, month }),
      getAllTransactions(),
      getMoneyContext(),
      getDueReminders(),
      getUpcomingRecurring(),
    ]);
    monthTx = monthData;
    allTx = allData;
    money = moneyContext;
    dueReminders = due;
    upcomingRecurring = upcoming;
  } catch {
    loadError = "Could not load data. Run the SQL migration in your new Supabase project.";
  }

  const scopedMonth = scope === "you" ? byPerson(monthTx, user.id) : monthTx;
  const scopedAll = scope === "you" ? byPerson(allTx, user.id) : allTx;

  return (
    <AppShell>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--muted-fg)]">Hello, {profile.display_name}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">This month</h1>
          <p className="mt-1 text-sm text-[var(--muted-fg)]">{monthLabel(year, month)}</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="mt-5">
        <ScopeToggle
          current={scope}
          familyHref="/"
          youHref="/?scope=you"
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {loadError}
        </p>
      ) : (
        <>
          <TotalsCard
            month={monthTotals(scopedMonth)}
            allTime={monthTotals(scopedAll)}
            money={money}
            transactions={scopedMonth}
            year={year}
            monthIndex={month}
          />

          <UpcomingRecurring payments={upcomingRecurring} money={money} />

          <DueReminders reminders={dueReminders} money={money} />

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
              Recent
            </h2>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {scopedMonth.slice(0, 8).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} money={money} />
            ))}
            {scopedMonth.length === 0 ? (
              <p className="rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
                No transactions yet. Tap Add to record income or an expense.
              </p>
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}
