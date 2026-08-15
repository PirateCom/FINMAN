import { LoginForm } from "@/components/login-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default function LoginPage() {
  const configured = isSupabaseConfigured();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col justify-center bg-[var(--surface)] px-6 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold tracking-[0.2em] text-[var(--accent)] uppercase">
          Household
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Family Finances</h1>
        <p className="mt-2 text-[var(--muted-fg)]">
          Sign in with your household account. New signups are closed.
        </p>
      </div>
      {configured ? (
        <LoginForm />
      ) : (
        <div className="rounded-2xl bg-[var(--muted)] p-4 text-sm leading-relaxed text-[var(--foreground)]">
          Add <code className="font-semibold">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-semibold">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="font-semibold">.env.local</code>, then restart the app. See the README.
        </div>
      )}
    </div>
  );
}
