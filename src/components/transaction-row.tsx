import Link from "next/link";
import { formatMoney } from "@/lib/money";
import type { Transaction } from "@/lib/types";

export function TransactionRow({
  tx,
  currency,
}: {
  tx: Transaction;
  currency: string;
}) {
  const income = tx.type === "income";
  return (
    <Link
      href={`/edit/${tx.id}`}
      className="flex items-center gap-3 rounded-2xl bg-[var(--card)] px-3 py-3"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white"
        style={{ backgroundColor: tx.category?.color ?? (income ? "#0F766E" : "#C45C26") }}
      >
        {(tx.category?.name ?? tx.type).slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">
          {tx.category?.name ?? (income ? "Income" : "Expense")}
        </span>
        <span className="block truncate text-xs text-[var(--muted-fg)]">
          {tx.note || tx.profile?.display_name || "Household"}
        </span>
      </span>
      <span
        className={`shrink-0 text-sm font-semibold ${
          income ? "text-[var(--income)]" : "text-[var(--expense)]"
        }`}
      >
        {income ? "+" : "−"}
        {formatMoney(tx.amount_bani, currency)}
      </span>
    </Link>
  );
}
