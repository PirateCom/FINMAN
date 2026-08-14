-- Automatic recurring income and expenses (standing orders).

create table if not exists public.recurring_payments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('income', 'expense')),
  amount_bani integer not null check (amount_bani > 0),
  category_id uuid references public.categories (id) on delete set null,
  note text,
  interval_months integer not null,
  next_date date not null,
  end_date date,
  active boolean not null default true,
  created_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recurring_payments_title_not_blank'
      and conrelid = 'public.recurring_payments'::regclass
  ) then
    alter table public.recurring_payments
      add constraint recurring_payments_title_not_blank
      check (char_length(trim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'recurring_payments_interval_months_allowed'
      and conrelid = 'public.recurring_payments'::regclass
  ) then
    alter table public.recurring_payments
      add constraint recurring_payments_interval_months_allowed
      check (interval_months in (1, 3, 6, 12));
  end if;
end $$;

create index if not exists recurring_payments_due_idx
  on public.recurring_payments (next_date)
  where active;

create index if not exists recurring_payments_category_id_idx
  on public.recurring_payments (category_id);

create index if not exists recurring_payments_created_by_idx
  on public.recurring_payments (created_by);

alter table public.transactions
  add column if not exists recurring_payment_id uuid references public.recurring_payments (id) on delete set null;

create index if not exists transactions_recurring_payment_id_idx
  on public.transactions (recurring_payment_id);

create unique index if not exists transactions_recurring_occurrence_idx
  on public.transactions (recurring_payment_id, date)
  where recurring_payment_id is not null;

drop trigger if exists recurring_payments_updated_at on public.recurring_payments;
create trigger recurring_payments_updated_at
  before update on public.recurring_payments
  for each row execute function public.touch_updated_at();

alter table public.recurring_payments enable row level security;

drop policy if exists "household recurring payments" on public.recurring_payments;
create policy "household recurring payments" on public.recurring_payments
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.recurring_payments to authenticated;

insert into public.categories (name, type, color)
select 'Investments', 'expense', '#1D4ED8'
where not exists (
  select 1 from public.categories
  where lower(name) = 'investments' and type = 'expense'
);
