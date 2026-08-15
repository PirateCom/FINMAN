"use client";

import { useState } from "react";
import { signIn } from "@/lib/actions";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={6}
          className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
        />
      </label>
      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-12 rounded-2xl bg-[var(--accent)] text-base font-semibold text-[var(--accent-fg)] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
