import { RemainingChart } from "@/components/remaining-chart";
import { remainingOfIncome } from "@/lib/data";
import { conversionNote, formatStoredMoney, type MoneyContext } from "@/lib/money";
import type { Transaction } from "@/lib/types";

export function TotalsCard({
  month,
  allTime,
  money,
  savings,
  transactions,
  year,
  monthIndex,
}: {
  month: { income: number; expense: number; net: number };
  allTime: { income: number; expense: number; net: number };
  money: MoneyContext;
  savings?: number;
  transactions?: Transaction[];
  year?: number;
  monthIndex?: number;
}) {
  const note = conversionNote(money);
  const series =
    transactions && year != null && monthIndex != null
      ? remainingOfIncome(transactions, year, monthIndex)
      : null;

  return (
    <>
      <div className="rounded-2xl bg-[var(--accent)] px-5 py-6 text-[var(--accent-fg)]">
        <p className="text-sm opacity-80">Remaining this month</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {formatStoredMoney(month.net, money)}
        </p>
        <p className="mt-3 text-sm opacity-80">
          All time remaining{" "}
          <span className="font-semibold opacity-100">{formatStoredMoney(allTime.net, money)}</span>
        </p>
        {savings != null ? (
          <p className="mt-2 text-sm opacity-80">
            Savings{" "}
            <span className="font-semibold opacity-100">{formatStoredMoney(savings, money)}</span>
          </p>
        ) : null}
        {note ? <p className="mt-2 text-xs opacity-70">{note}</p> : null}
      </div>

      {series ? <RemainingChart series={series} /> : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs font-medium text-[var(--muted-fg)]">Income</p>
          <p className="mt-1 text-lg font-semibold text-[var(--income)]">
            {formatStoredMoney(month.income, money)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs font-medium text-[var(--muted-fg)]">Expenses</p>
          <p className="mt-1 text-lg font-semibold text-[var(--expense)]">
            {formatStoredMoney(month.expense, money)}
          </p>
        </div>
      </div>
    </>
  );
}
