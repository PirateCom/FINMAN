import { formatMoney } from "@/lib/money";

export function TotalsCard({
  month,
  allTime,
  currency,
  savings,
}: {
  month: { income: number; expense: number; net: number };
  allTime: { income: number; expense: number; net: number };
  currency: string;
  savings?: number;
}) {
  return (
    <>
      <div className="rounded-[28px] bg-[var(--accent)] px-5 py-6 text-[var(--accent-fg)]">
        <p className="text-sm opacity-80">Remaining this month</p>
        <p className="mt-1 text-3xl font-semibold tracking-tight">
          {formatMoney(month.net, currency)}
        </p>
        <p className="mt-3 text-sm opacity-80">
          All time remaining{" "}
          <span className="font-semibold opacity-100">{formatMoney(allTime.net, currency)}</span>
        </p>
        {savings != null ? (
          <p className="mt-2 text-sm opacity-80">
            Savings{" "}
            <span className="font-semibold opacity-100">{formatMoney(savings, currency)}</span>
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs font-medium text-[var(--muted-fg)]">Income</p>
          <p className="mt-1 text-lg font-semibold text-[var(--income)]">
            {formatMoney(month.income, currency)}
          </p>
        </div>
        <div className="rounded-2xl bg-[var(--card)] p-4">
          <p className="text-xs font-medium text-[var(--muted-fg)]">Expenses</p>
          <p className="mt-1 text-lg font-semibold text-[var(--expense)]">
            {formatMoney(month.expense, currency)}
          </p>
        </div>
      </div>
    </>
  );
}
