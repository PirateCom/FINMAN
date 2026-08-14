"use client";

import { useState } from "react";
import { setSavings } from "@/lib/actions";
import { baniToInput, formatStoredMoney, toDisplayBani, type MoneyContext } from "@/lib/money";

export function SavingsForm({
  userId,
  money,
  current,
  canEdit,
}: {
  userId: string;
  money: MoneyContext;
  current: number;
  canEdit: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editing, setEditing] = useState(false);
  const shown = toDisplayBani(current, money);

  async function onSave(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await setSavings(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
      return;
    }
    setEditing(false);
    setPending(false);
  }

  if (!canEdit) {
    return (
      <p className="text-sm font-semibold">{formatStoredMoney(current, money)}</p>
    );
  }

  if (editing) {
    return (
      <form action={onSave} className="flex min-w-0 flex-col gap-2">
        <input type="hidden" name="user_id" value={userId} />
        <input
          name="amount"
          inputMode="decimal"
          required
          defaultValue={shown.bani ? baniToInput(shown.bani) : ""}
          placeholder={`Amount (${shown.currency})`}
          className="h-10 w-full rounded-xl border border-[var(--accent-fg)]/20 bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none ring-[var(--accent-fg)] focus:ring-2"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="h-9 flex-1 rounded-xl bg-[var(--accent-fg)] text-sm font-semibold text-[var(--accent)] disabled:opacity-60"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setError(null);
            }}
            className="h-9 flex-1 rounded-xl border border-[var(--accent-fg)]/30 text-sm font-semibold"
          >
            Cancel
          </button>
        </div>
        {error ? <p className="text-xs opacity-90">{error}</p> : null}
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <p className="text-sm font-semibold">{formatStoredMoney(current, money)}</p>
      <button
        type="button"
        onClick={() => {
          setEditing(true);
          setError(null);
        }}
        className="shrink-0 rounded-full bg-[var(--accent-fg)]/15 px-3 py-1 text-xs font-semibold"
      >
        Edit
      </button>
    </div>
  );
}
