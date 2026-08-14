"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addCategory, deleteTransaction, saveTransaction } from "@/lib/actions";
import { baniToInput, todayISO } from "@/lib/money";
import type { Category, Transaction, TxType } from "@/lib/types";

export function TransactionForm({
  categories,
  currency,
  transaction,
}: {
  categories: Category[];
  currency: string;
  transaction?: Transaction;
}) {
  const router = useRouter();
  const [type, setType] = useState<TxType>(transaction?.type ?? "expense");
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const visible = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type],
  );

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("type", type);
    formData.set("category_id", categoryId);
    const result = await saveTransaction(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  async function onAddCategory() {
    const name = newCategory.trim();
    if (!name) return;
    const formData = new FormData();
    formData.set("name", name);
    formData.set("type", type);
    formData.set("color", type === "income" ? "#0F766E" : "#C45C26");
    const result = await addCategory(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNewCategory("");
    setAddingCategory(false);
    router.refresh();
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}

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
        <span className="text-sm font-medium text-[var(--muted-fg)]">Amount</span>
        <div className="relative">
          <input
            name="amount"
            inputMode="decimal"
            required
            defaultValue={transaction ? baniToInput(transaction.amount_bani) : ""}
            placeholder="0.00"
            className="h-16 w-full rounded-2xl border border-[var(--border)] bg-white px-4 pr-16 text-3xl font-semibold tracking-tight outline-none ring-[var(--accent)] focus:ring-2"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--muted-fg)]">
            {currency}
          </span>
        </div>
      </label>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[var(--muted-fg)]">Category</span>
          <button
            type="button"
            onClick={() => setAddingCategory((v) => !v)}
            className="text-sm font-semibold text-[var(--accent)]"
          >
            {addingCategory ? "Cancel" : "+ New"}
          </button>
        </div>
        {addingCategory ? (
          <div className="mb-3 flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="h-11 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm outline-none ring-[var(--accent)] focus:ring-2"
            />
            <button
              type="button"
              onClick={onAddCategory}
              className="h-11 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {visible.map((cat) => {
            const selected = categoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(cat.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium ${
                  selected ? "text-white" : "bg-white text-[var(--foreground)]"
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
        Date
        <input
          name="date"
          type="date"
          required
          defaultValue={transaction?.date ?? todayISO()}
          className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Note <span className="font-normal text-[var(--muted-fg)]">(optional)</span>
        <input
          name="note"
          defaultValue={transaction?.note ?? ""}
          placeholder="What was this for?"
          className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
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
        {pending ? "Saving…" : transaction ? "Save changes" : "Add transaction"}
      </button>

      {transaction ? (
        <button
          type="submit"
          formAction={deleteTransaction}
          formNoValidate
          name="id"
          value={transaction.id}
          onClick={(e) => {
            if (!confirm("Delete this transaction?")) e.preventDefault();
          }}
          className="h-11 text-sm font-semibold text-[var(--expense)]"
        >
          Delete
        </button>
      ) : null}
    </form>
  );
}
