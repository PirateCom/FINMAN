import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  ensureProfile,
  getCategories,
  getSettings,
  getUser,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");

  const [profile, settings, categories] = await Promise.all([
    ensureProfile(user.id, user.email),
    getSettings(),
    getCategories(),
  ]);

  return (
    <AppShell title="Settings" action={<ThemeToggle />}>
      <SettingsForm
        profile={profile}
        currency={settings.currency}
        categories={categories}
      />
    </AppShell>
  );
}
