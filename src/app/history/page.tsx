import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MonthNav } from "@/components/month-nav";
import { TransactionRow } from "@/components/transaction-row";
import {
  ensureProfile,
  getSettings,
  getTransactions,
  getUser,
  monthTotals,
} from "@/lib/data";
import { formatMoney, parseMonthParam } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const q = await searchParams;
  const { year, month } = parseMonthParam(q.month);
  const type = (["all", "income", "expense"].includes(q.type ?? "")
    ? q.type
    : "all") as TxType | "all";

  const settings = await getSettings();
  const all = await getTransactions({ year, month });
  const transactions = type === "all" ? all : all.filter((tx) => tx.type === type);
  const { income, expense } = monthTotals(all);

  const filters: { id: TxType | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "expense", label: "Out" },
    { id: "income", label: "In" },
  ];

  const monthParam = `${year}-${String(month).padStart(2, "0")}`;

  return (
    <AppShell title="History">
      <MonthNav
        year={year}
        month={month}
        basePath="/history"
        extraQuery={type !== "all" ? `type=${type}` : ""}
      />

      <p className="mb-4 text-center text-sm text-[var(--muted-fg)]">
        In {formatMoney(income, settings.currency)} · Out{" "}
        {formatMoney(expense, settings.currency)}
      </p>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={`/history?month=${monthParam}&type=${f.id}`}
            className={`h-10 rounded-full text-center text-sm font-semibold leading-10 ${
              type === f.id
                ? "bg-[var(--accent)] text-white"
                : "bg-white text-[var(--muted-fg)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} currency={settings.currency} />
        ))}
        {transactions.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
            Nothing in this month yet.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
