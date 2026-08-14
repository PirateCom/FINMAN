import Link from "next/link";
import { formatStoredMoney, todayISO, type MoneyContext } from "@/lib/money";
import { recurringIntervalLabel } from "@/lib/recurring";
import { dueLabel } from "@/lib/reminders";
import type { RecurringPayment } from "@/lib/types";

export function UpcomingRecurring({
  payments,
  money,
}: {
  payments: RecurringPayment[];
  money: MoneyContext;
}) {
  if (payments.length === 0) return null;
  const today = todayISO();

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Automatic
        </h2>
        <Link href="/recurring" className="text-sm font-semibold text-[var(--accent)]">
          Manage
        </Link>
      </div>
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
                style={{ backgroundColor: payment.category?.color ?? (income ? "#0F766E" : "#1D4ED8") }}
              >
                {payment.title.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{payment.title}</span>
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
      </div>
    </section>
  );
}
