"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/actions";

export function LoginForm() {
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = mode === "signup" ? await signUp(formData) : await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setPending(false);
    }
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-[var(--muted)] p-1">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`h-10 rounded-xl text-sm font-semibold ${
            mode === "signup" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-fg)]"
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={`h-10 rounded-xl text-sm font-semibold ${
            mode === "signin" ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-fg)]"
          }`}
        >
          Sign in
        </button>
      </div>

      <form action={onSubmit} className="flex flex-col gap-4">
        {mode === "signup" ? (
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Username
            <input
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="Your name"
              className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-base font-normal outline-none ring-[var(--accent)] focus:ring-2"
            />
          </label>
        ) : null}
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
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          {pending
            ? mode === "signup"
              ? "Creating account…"
              : "Signing in…"
            : mode === "signup"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>
    </div>
  );
}
