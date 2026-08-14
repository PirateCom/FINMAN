"use client";

import { useMemo, useState } from "react";
import { deleteReminder, saveReminder } from "@/lib/actions";
import { baniToInput, todayISO, toDisplayBani, type MoneyContext } from "@/lib/money";
import { REMINDER_PRESETS, REPEAT_OPTIONS } from "@/lib/reminders";
import type { Category, Reminder, RepeatMonths } from "@/lib/types";

export function ReminderForm({
  categories,
  money,
  reminder,
}: {
  categories: Category[];
  money: MoneyContext;
  reminder?: Reminder;
}) {
  const expenses = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const [title, setTitle] = useState(reminder?.title ?? "");
  const [categoryId, setCategoryId] = useState(reminder?.category_id ?? "");
  const [repeat, setRepeat] = useState<RepeatMonths>(reminder?.repeat_months ?? 0);
  const [presetId, setPresetId] = useState(reminder ? "" : "custom");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const amountShown = reminder
    ? toDisplayBani(reminder.amount_bani, money)
    : { bani: 0, currency: money.display };

  function applyPreset(id: string) {
    const preset = REMINDER_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    if (preset.id !== "custom" || !title) setTitle(preset.title);
    setRepeat(preset.repeat);
    if (preset.categoryName) {
      const match = expenses.find(
        (c) => c.name.toLowerCase() === preset.categoryName.toLowerCase(),
      );
      if (match) setCategoryId(match.id);
    }
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("title", title);
    formData.set("category_id", categoryId);
    formData.set("repeat_months", String(repeat));
    const result = await saveReminder(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {reminder ? <input type="hidden" name="id" value={reminder.id} /> : null}

      {!reminder ? (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--muted-fg)]">Start from</p>
          <div className="flex flex-wrap gap-2">
            {REMINDER_PRESETS.map((preset) => {
              const selected = presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                    selected
                      ? "bg-[var(--accent)] text-[var(--accent-fg)]"
                      : "bg-[var(--card)] text-[var(--foreground)]"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-[var(--muted-fg)]">What to pay</span>
        <input
          name="title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setPresetId("custom");
          }}
          required
          placeholder="Life insurance"
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
            defaultValue={reminder ? baniToInput(amountShown.bani) : ""}
            placeholder="0.00"
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
          {expenses.map((cat) => {
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
        Due date
        <input
          name="due_date"
          type="date"
          required
          defaultValue={reminder?.due_date ?? todayISO()}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Repeat
        <select
          name="repeat_months"
          value={repeat}
          onChange={(e) => setRepeat(Number(e.target.value) as RepeatMonths)}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        >
          {REPEAT_OPTIONS.map((option) => (
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
          defaultValue={reminder?.note ?? ""}
          placeholder="Policy number, car, etc."
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-2xl bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] disabled:opacity-60"
      >
        {pending ? "Saving…" : reminder ? "Save reminder" : "Add reminder"}
      </button>

      {reminder ? (
        <button
          type="submit"
          formAction={deleteReminder}
          formNoValidate
          onClick={(e) => {
            if (!confirm("Delete this reminder?")) e.preventDefault();
          }}
          className="h-11 text-sm font-semibold text-[var(--expense)]"
        >
          Delete
        </button>
      ) : null}
    </form>
  );
}
