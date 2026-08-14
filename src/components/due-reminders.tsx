"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markReminderPaid } from "@/lib/actions";
import {
  baniToInput,
  formatStoredMoney,
  todayISO,
  toDisplayBani,
  type MoneyContext,
} from "@/lib/money";
import { dueLabel } from "@/lib/reminders";
import type { Reminder } from "@/lib/types";

export function DueReminders({
  reminders,
  money,
}: {
  reminders: Reminder[];
  money: MoneyContext;
}) {
  const router = useRouter();
  const today = todayISO();
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onPaid(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await markReminderPaid(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setPayingId(null);
    setPending(false);
    router.refresh();
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Due soon
        </h2>
        <Link href="/reminders" className="text-sm font-semibold text-[var(--accent)]">
          Manage
        </Link>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2">
        {reminders.map((reminder) => {
          const overdue = reminder.due_date < today;
          const shown = toDisplayBani(reminder.amount_bani, money);
          const paying = payingId === reminder.id;
          return (
            <div key={reminder.id} className="rounded-2xl bg-[var(--card)] px-3 py-3">
              <div className="flex items-center gap-3">
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
                    {dueLabel(reminder.due_date, today)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--expense)]">
                  {formatStoredMoney(reminder.amount_bani, money)}
                </span>
              </div>

              {paying ? (
                <form action={onPaid} className="mt-3 flex flex-col gap-2">
                  <input type="hidden" name="id" value={reminder.id} />
                  <div className="relative">
                    <input
                      name="amount"
                      inputMode="decimal"
                      required
                      defaultValue={baniToInput(shown.bani)}
                      className="h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 pr-14 text-base outline-none ring-[var(--accent)] focus:ring-2"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--muted-fg)]">
                      {shown.currency}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPayingId(null);
                        setError(null);
                      }}
                      className="h-11 rounded-xl border border-[var(--border)] text-sm font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={pending}
                      className="h-11 rounded-xl bg-[var(--accent)] text-sm font-semibold text-[var(--accent-fg)] disabled:opacity-60"
                    >
                      {pending ? "Saving…" : "Confirm paid"}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPayingId(reminder.id);
                    setError(null);
                  }}
                  className="mt-3 h-10 w-full rounded-xl bg-[var(--muted)] text-sm font-semibold"
                >
                  Paid
                </button>
              )}
            </div>
          );
        })}
        {reminders.length === 0 ? (
          <p className="rounded-2xl bg-[var(--card)] px-4 py-6 text-center text-sm text-[var(--muted-fg)]">
            Nothing due in the next 30 days.
          </p>
        ) : null}
      </div>
    </section>
  );
}
