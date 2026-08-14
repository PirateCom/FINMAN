"use client";

import { useState } from "react";
import { addCategory, updateCurrency, updateDisplayName } from "@/lib/actions";
import type { Category, Profile } from "@/lib/types";

const CURRENCIES = ["RON", "EUR", "USD", "GBP"];

export function SettingsForm({
  profile,
  profiles,
  currency,
  categories,
}: {
  profile: Profile;
  profiles: Profile[];
  currency: string;
  categories: Category[];
}) {
  const [nameError, setNameError] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  async function onName(formData: FormData) {
    setNameError(null);
    const result = await updateDisplayName(formData);
    if (result.error) setNameError(result.error);
    else setSaved("Name saved");
  }

  async function onCurrency(formData: FormData) {
    await updateCurrency(formData);
    setSaved("Currency saved");
  }

  async function onCategory(formData: FormData) {
    setCatError(null);
    const result = await addCategory(formData);
    if (result.error) setCatError(result.error);
    else setSaved("Category added");
  }

  return (
    <div className="flex flex-col gap-8">
      {saved ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{saved}</p>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          You
        </h2>
        <form action={onName} className="flex flex-col gap-3">
          <input
            name="display_name"
            defaultValue={profile.display_name}
            className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 outline-none ring-[var(--accent)] focus:ring-2"
          />
          {nameError ? <p className="text-sm text-red-700">{nameError}</p> : null}
          <button
            type="submit"
            className="h-11 rounded-2xl bg-[var(--accent)] font-semibold text-white"
          >
            Save name
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Household
        </h2>
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl bg-white">
          {profiles.map((p) => (
            <li key={p.id} className="px-4 py-3 text-sm font-medium">
              <span className="block">{p.display_name}</span>
              {p.email ? (
                <span className="block text-xs font-normal text-[var(--muted-fg)]">{p.email}</span>
              ) : null}
              {p.id === profile.id ? (
                <span className="text-xs font-normal text-[var(--muted-fg)]">you</span>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Currency
        </h2>
        <form action={onCurrency}>
          <select
            name="currency"
            defaultValue={currency}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-white px-4 outline-none"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--muted-fg)]">
          Add category
        </h2>
        <form action={onCategory} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Name"
            className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4 outline-none ring-[var(--accent)] focus:ring-2"
          />
          <select
            name="type"
            className="h-12 rounded-2xl border border-[var(--border)] bg-white px-4"
            defaultValue="expense"
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input type="hidden" name="color" value="#78716C" />
          {catError ? <p className="text-sm text-red-700">{catError}</p> : null}
          <button
            type="submit"
            className="h-11 rounded-2xl border border-[var(--border)] bg-white font-semibold"
          >
            Add category
          </button>
        </form>
        <p className="mt-3 text-xs text-[var(--muted-fg)]">
          {categories.length} categories in use
        </p>
      </section>

      <p className="text-center text-xs leading-relaxed text-[var(--muted-fg)]">
        On your phone: open this site in the browser, then use{" "}
        <strong>Add to Home Screen</strong> so it feels like an app. You stay signed in.
      </p>
    </div>
  );
}
