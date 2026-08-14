import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  byPerson,
  ensureProfile,
  getAllTransactions,
  getProfiles,
  getSettings,
  getTransactions,
  getUser,
  monthTotals,
} from "@/lib/data";
import { formatMoney, monthLabel, parseMonthParam } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function FamilyPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const { year, month } = parseMonthParam(undefined);
  const [members, settings, monthTx, allTx] = await Promise.all([
    getProfiles(),
    getSettings(),
    getTransactions({ year, month }),
    getAllTransactions(),
  ]);

  return (
    <AppShell title="Family" action={<ThemeToggle />}>
      <p className="mb-4 text-sm text-[var(--muted-fg)]">
        {members.length} {members.length === 1 ? "member" : "members"} · {monthLabel(year, month)}
      </p>

      <ul className="flex flex-col gap-3">
        {members.map((member) => {
          const monthStats = monthTotals(byPerson(monthTx, member.id));
          const allStats = monthTotals(byPerson(allTx, member.id));
          const isYou = member.id === user.id;
          const initial = (member.display_name || "?").slice(0, 1).toUpperCase();

          return (
            <li key={member.id} className="rounded-2xl bg-[var(--card)] p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg font-semibold text-[var(--accent-fg)]">
                  {initial}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {member.display_name}
                    {isYou ? (
                      <span className="ml-2 text-xs font-medium text-[var(--muted-fg)]">you</span>
                    ) : null}
                  </p>
                  {member.email ? (
                    <p className="truncate text-sm text-[var(--muted-fg)]">{member.email}</p>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Remaining this month</p>
                  <p className="mt-0.5 font-semibold">{formatMoney(monthStats.net, settings.currency)}</p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">All time remaining</p>
                  <p className="mt-0.5 font-semibold">{formatMoney(allStats.net, settings.currency)}</p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Income</p>
                  <p className="mt-0.5 font-semibold text-[var(--income)]">
                    {formatMoney(monthStats.income, settings.currency)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Expenses</p>
                  <p className="mt-0.5 font-semibold text-[var(--expense)]">
                    {formatMoney(monthStats.expense, settings.currency)}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {members.length === 0 ? (
        <p className="rounded-2xl bg-[var(--card)] px-4 py-8 text-center text-sm text-[var(--muted-fg)]">
          No family members yet. Each person signs up once, then they appear here.
        </p>
      ) : null}
    </AppShell>
  );
}
