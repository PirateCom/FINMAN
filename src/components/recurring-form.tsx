"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteRecurringPayment, saveRecurringPayment } from "@/lib/actions";
import { baniToInput, todayISO, toDisplayBani, type MoneyContext } from "@/lib/money";
import { RECURRING_INTERVALS } from "@/lib/recurring";
import type { Category, RecurringInterval, RecurringPayment, TxType } from "@/lib/types";

export function RecurringForm({
  categories,
  money,
  payment,
}: {
  categories: Category[];
  money: MoneyContext;
  payment?: RecurringPayment;
}) {
  const router = useRouter();
  const [type, setType] = useState<TxType>(payment?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(payment?.category_id ?? "");
  const [interval, setInterval] = useState<RecurringInterval>(payment?.interval_months ?? 1);
  const [active, setActive] = useState(payment?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amountShown = payment
    ? toDisplayBani(payment.amount_bani, money)
    : { bani: 0, currency: money.display };

  const visible = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("type", type);
    formData.set("category_id", categoryId);
    formData.set("interval_months", String(interval));
    formData.set("active", active ? "true" : "false");
    const result = await saveRecurringPayment(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {payment ? <input type="hidden" name="id" value={payment.id} /> : null}

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--muted)] p-1">
        {(["expense", "income"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setType(value);
              setCategoryId("");
            }}
            className={`h-11 rounded-xl text-sm font-semibold capitalize ${
              type === value
                ? value === "income"
                  ? "bg-[var(--income)] text-white shadow-sm"
                  : "bg-[var(--expense)] text-white shadow-sm"
                : "text-[var(--muted-fg)]"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--muted-fg)]">Name</span>
        <input
          name="title"
          required
          defaultValue={payment?.title ?? ""}
          placeholder="Stocks"
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--muted-fg)]">Amount</span>
        <div className="relative">
          <input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={payment ? baniToInput(amountShown.bani) : ""}
            placeholder="3500.00"
            className="h-16 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 pr-16 text-3xl font-semibold tracking-tight outline-none ring-[var(--accent)] focus:ring-2"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--muted-fg)]">
            {amountShown.currency}
          </span>
        </div>
      </label>

      <div>
        <span className="mb-2 block text-sm font-medium text-[var(--muted-fg)]">Category</span>
        <div className="flex flex-wrap gap-2">
          {visible.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(selected ? "" : cat.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  selected ? "text-white" : "bg-[var(--card)] text-[var(--foreground)]"
                }`}
                style={{
                  backgroundColor: selected ? cat.color : undefined,
                  border: selected ? "none" : `1px solid color-mix(in srgb, ${cat.color} 35%, #d6d3d1)`,
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Next payment
        <input
          name="next_date"
          type="date"
          required
          defaultValue={payment?.next_date ?? todayISO()}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Repeat
        <select
          name="interval_months"
          value={interval}
          onChange={(e) => setInterval(Number(e.target.value) as RecurringInterval)}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        >
          {RECURRING_INTERVALS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Note <span className="font-normal text-[var(--muted-fg)]">(optional)</span>
        <input
          name="note"
          defaultValue={payment?.note ?? ""}
          placeholder="Avanza, ISK, …"
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      {payment ? (
        <button
          type="button"
          onClick={() => setActive((v) => !v)}
          className="flex h-12 items-center justify-between rounded-2xl bg-[var(--card)] px-4 text-sm font-semibold"
        >
          Automatic posting
          <span className="font-medium text-[var(--muted-fg)]">{active ? "On" : "Paused"}</span>
        </button>
      ) : (
        <p className="text-sm leading-relaxed text-[var(--muted-fg)]">
          If the next date is today or earlier, the first payment is added now. After that it posts on its own when you open the app.
        </p>
      )}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-2xl bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] disabled:opacity-60"
      >
        {pending ? "Saving…" : payment ? "Save changes" : "Add automatic payment"}
      </button>

      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined" && window.history.length > 1) {
            router.back();
          } else {
            router.push("/recurring");
          }
        }}
        className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-base font-semibold"
      >
        Cancel
      </button>

      {payment ? (
        <button
          type="submit"
          formAction={deleteRecurringPayment}
          formNoValidate
          onClick={(e) => {
            if (!confirm("Stop this automatic payment? Past transactions stay in history.")) {
              e.preventDefault();
            }
          }}
          className="h-11 text-sm font-semibold text-[var(--expense)]"
        >
          Delete
        </button>
      ) : null}
    </form>
  );
}
