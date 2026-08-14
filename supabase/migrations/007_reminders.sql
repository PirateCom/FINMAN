-- Household payment reminders (custom + UI presets). Marking paid creates an expense.

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  amount_bani integer not null check (amount_bani > 0),
  category_id uuid references public.categories (id) on delete set null,
  due_date date not null,
  repeat_months integer not null default 0,
  note text,
  created_by uuid not null references public.users (id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reminders_title_not_blank'
      and conrelid = 'public.reminders'::regclass
  ) then
    alter table public.reminders
      add constraint reminders_title_not_blank check (char_length(trim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'reminders_repeat_months_allowed'
      and conrelid = 'public.reminders'::regclass
  ) then
    alter table public.reminders
      add constraint reminders_repeat_months_allowed
      check (repeat_months in (0, 1, 6, 12));
  end if;
end $$;

create index if not exists reminders_due_date_idx
  on public.reminders (due_date)
  where completed_at is null;

create index if not exists reminders_category_id_idx
  on public.reminders (category_id);

create index if not exists reminders_created_by_idx
  on public.reminders (created_by);

alter table public.transactions
  add column if not exists reminder_id uuid references public.reminders (id) on delete set null;

create index if not exists transactions_reminder_id_idx
  on public.transactions (reminder_id);

drop trigger if exists reminders_updated_at on public.reminders;
create trigger reminders_updated_at
  before update on public.reminders
  for each row execute function public.touch_updated_at();

alter table public.reminders enable row level security;

drop policy if exists "household reminders" on public.reminders;
create policy "household reminders" on public.reminders
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.reminders to authenticated;
