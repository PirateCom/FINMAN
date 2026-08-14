import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SettingsForm } from "@/components/settings-form";
import {
  ensureProfile,
  getCategories,
  getProfiles,
  getSettings,
  getUser,
} from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");

  const [profile, profiles, settings, categories] = await Promise.all([
    ensureProfile(user.id, user.email),
    getProfiles(),
    getSettings(),
    getCategories(),
  ]);

  return (
    <AppShell title="Settings">
      <SettingsForm
        profile={profile}
        profiles={profiles}
        currency={settings.currency}
        categories={categories}
      />
    </AppShell>
  );
}
