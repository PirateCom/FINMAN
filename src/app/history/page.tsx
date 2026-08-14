import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { MonthNav } from "@/components/month-nav";
import { ScopeToggle } from "@/components/scope-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { TotalsCard } from "@/components/totals-card";
import { TransactionRow } from "@/components/transaction-row";
import {
  byPerson,
  ensureProfile,
  getAllTransactions,
  getMoneyContext,
  getTransactions,
  getUser,
  monthTotals,
  parseScope,
} from "@/lib/data";
import { parseMonthParam } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { TxType } from "@/lib/types";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; scope?: string }>;
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
  const scope = parseScope(q.scope);

  const [monthAll, allTime, money] = await Promise.all([
    getTransactions({ year, month }),
    getAllTransactions(),
    getMoneyContext(),
  ]);

  const scopedMonth = scope === "you" ? byPerson(monthAll, user.id) : monthAll;
  const scopedAll = scope === "you" ? byPerson(allTime, user.id) : allTime;
  const listed =
    type === "all" ? scopedMonth : scopedMonth.filter((tx) => tx.type === type);

  const filters: { id: TxType | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "expense", label: "Out" },
    { id: "income", label: "In" },
  ];

  const monthParam = `${year}-${String(month).padStart(2, "0")}`;
  const extra = [
    type !== "all" ? `type=${type}` : "",
    scope === "you" ? "scope=you" : "",
  ]
    .filter(Boolean)
    .join("&");

  function historyHref(next: { type?: string; scope?: string }) {
    const params = new URLSearchParams();
    params.set("month", monthParam);
    const nextType = next.type ?? type;
    const nextScope = next.scope ?? scope;
    if (nextType !== "all") params.set("type", nextType);
    if (nextScope === "you") params.set("scope", "you");
    return `/history?${params.toString()}`;
  }

  return (
    <AppShell title="History" action={<ThemeToggle />}>
      <ScopeToggle
        current={scope}
        familyHref={historyHref({ scope: "family" })}
        youHref={historyHref({ scope: "you" })}
      />

      <MonthNav year={year} month={month} basePath="/history" extraQuery={extra} />

      <div className="mb-4">
        <TotalsCard
          month={monthTotals(scopedMonth)}
          allTime={monthTotals(scopedAll)}
          money={money}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        {filters.map((f) => (
          <Link
            key={f.id}
            href={historyHref({ type: f.id })}
            className={`h-10 rounded-full text-center text-sm font-semibold leading-10 ${
              type === f.id
                ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                : "bg-[var(--card)] text-[var(--muted-fg)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {listed.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} money={money} />
        ))}
        {listed.length === 0 ? (
          <p className="rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
            Nothing in this month yet.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
