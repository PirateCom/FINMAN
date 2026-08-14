import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SavingsForm } from "@/components/savings-form";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  byPerson,
  ensureProfile,
  getAllTransactions,
  getMoneyContext,
  getProfiles,
  getSavingsByUser,
  getTransactions,
  getUser,
  monthTotals,
} from "@/lib/data";
import { conversionNote, formatStoredMoney, monthLabel, parseMonthParam } from "@/lib/money";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function FamilyPage() {
  if (!isSupabaseConfigured()) redirect("/login");
  const user = await getUser();
  if (!user) redirect("/login");
  await ensureProfile(user.id, user.email);

  const { year, month } = parseMonthParam(undefined);
  const [members, money, monthTx, allTx] = await Promise.all([
    getProfiles(),
    getMoneyContext(),
    getTransactions({ year, month }),
    getAllTransactions(),
  ]);

  let savings: Record<string, number> = {};
  try {
    savings = await getSavingsByUser();
  } catch {
    savings = {};
  }

  const householdSavings = Object.values(savings).reduce((sum, n) => sum + n, 0);
  const note = conversionNote(money);
  const listedMembers = [...members].sort((a, b) => {
    if (a.id === user.id) return -1;
    if (b.id === user.id) return 1;
    return a.display_name.localeCompare(b.display_name);
  });

  return (
    <AppShell title="Family" action={<ThemeToggle />}>
      <p className="mb-4 text-sm text-[var(--muted-fg)]">
        {members.length} {members.length === 1 ? "member" : "members"} · {monthLabel(year, month)}
      </p>

      <div className="mb-4 overflow-hidden rounded-[28px] bg-[var(--accent)] text-[var(--accent-fg)]">
        <div className="px-5 py-5">
          <p className="text-sm opacity-80">Household savings</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight">
            {formatStoredMoney(householdSavings, money)}
          </p>
          {note ? <p className="mt-2 text-xs opacity-70">{note}</p> : null}
        </div>

        {listedMembers.length > 0 ? (
          <ul className="border-t border-[var(--accent-fg)]/15">
            {listedMembers.map((member) => {
              const isYou = member.id === user.id;
              const saved = savings[member.id] ?? 0;
              return (
                <li
                  key={member.id}
                  className="flex items-start justify-between gap-3 px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {isYou ? "My savings" : member.display_name}
                    </p>
                    {isYou ? (
                      <p className="truncate text-xs opacity-70">{member.display_name}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <SavingsForm
                      userId={member.id}
                      money={money}
                      current={saved}
                      canEdit={isYou}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

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

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Remaining this month</p>
                  <p className="mt-0.5 font-semibold">{formatStoredMoney(monthStats.net, money)}</p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">All time remaining</p>
                  <p className="mt-0.5 font-semibold">{formatStoredMoney(allStats.net, money)}</p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Income</p>
                  <p className="mt-0.5 font-semibold text-[var(--income)]">
                    {formatStoredMoney(monthStats.income, money)}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--muted)] px-3 py-2">
                  <p className="text-xs text-[var(--muted-fg)]">Expenses</p>
                  <p className="mt-0.5 font-semibold text-[var(--expense)]">
                    {formatStoredMoney(monthStats.expense, money)}
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
