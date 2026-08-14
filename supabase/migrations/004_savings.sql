-- Savings account per family member (positive = deposit, negative = withdraw).

create table if not exists public.savings_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  amount_bani integer not null check (amount_bani <> 0),
  note text,
  entered_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists savings_movements_user_idx on public.savings_movements (user_id);

alter table public.savings_movements enable row level security;

drop policy if exists "household savings" on public.savings_movements;
create policy "household savings" on public.savings_movements
  for all to authenticated using (true) with check (true);
