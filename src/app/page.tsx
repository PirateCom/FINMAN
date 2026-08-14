import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TransactionRow } from "@/components/transaction-row";
import {
  ensureProfile,
  getSettings,
  getTransactions,
  getUser,
  monthTotals,
} from "@/lib/data";
import { formatMoney, monthLabel, parseMonthParam } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Transaction } from "@/lib/types";

export default async function HomePage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");

  const profile = await ensureProfile(user.id, user.email);
  const { year, month } = parseMonthParam(undefined);
  let transactions: Transaction[] = [];
  let currency = "RON";
  let loadError: string | null = null;

  try {
    const settings = await getSettings();
    currency = settings.currency;
    transactions = await getTransactions({ year, month });
  } catch {
    loadError = "Could not load data. Run the SQL migration in your new Supabase project.";
  }

  const { income, expense, net } = monthTotals(transactions);

  return (
    <AppShell>
      <p className="text-sm text-[var(--muted-fg)]">Hello, {profile.display_name}</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">This month</h1>
      <p className="mb-5 mt-1 text-sm text-[var(--muted-fg)]">{monthLabel(year, month)}</p>

      {loadError ? (
        <p className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{loadError}</p>
      ) : (
        <>
          <div className="rounded-[28px] bg-[var(--accent)] px-5 py-6 text-[var(--accent-fg)]">
            <p className="text-sm opacity-80">Balance</p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
              {formatMoney(net, currency)}
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-[var(--muted-fg)]">Income</p>
              <p className="mt-1 text-lg font-semibold text-[var(--income)]">
                {formatMoney(income, currency)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-medium text-[var(--muted-fg)]">Expenses</p>
              <p className="mt-1 text-lg font-semibold text-[var(--expense)]">
                {formatMoney(expense, currency)}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
              Recent
            </h2>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {transactions.slice(0, 8).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} currency={currency} />
            ))}
            {transactions.length === 0 ? (
              <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
                No transactions yet. Tap Add to record income or an expense.
              </p>
            ) : null}
          </div>
        </>
      )}
    </AppShell>
  );
}
