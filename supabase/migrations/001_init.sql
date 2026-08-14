-- Family Finances — run this in the Supabase SQL editor (new project, not Tocab).

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'Family member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  id int primary key default 1 check (id = 1),
  currency text not null default 'SEK',
  updated_at timestamptz not null default now()
);

insert into public.settings (id, currency) values (1, 'SEK');

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null default '#78716C',
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('income', 'expense')),
  amount_bani integer not null check (amount_bani > 0),
  category_id uuid references public.categories (id) on delete set null,
  date date not null default (current_date),
  note text,
  entered_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_date_idx on public.transactions (date desc);
create index transactions_type_idx on public.transactions (type);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists transactions_updated_at on public.transactions;
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.touch_updated_at();

alter table public.users enable row level security;
alter table public.settings enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "household read users" on public.users
  for select to authenticated using (true);

create policy "own user insert" on public.users
  for insert to authenticated with check (auth.uid() = id);

create policy "own user update" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "household settings" on public.settings
  for all to authenticated using (true) with check (true);

create policy "household categories" on public.categories
  for all to authenticated using (true) with check (true);

create policy "household transactions" on public.transactions
  for all to authenticated using (true) with check (true);

create table public.savings_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  amount_bani integer not null check (amount_bani <> 0),
  note text,
  entered_by uuid not null references public.users (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index savings_movements_user_idx on public.savings_movements (user_id);

alter table public.savings_movements enable row level security;

create policy "household savings" on public.savings_movements
  for all to authenticated using (true) with check (true);

insert into public.categories (name, type, color) values
  ('Groceries', 'expense', '#3F7D4E'),
  ('Dining', 'expense', '#C45C26'),
  ('Rent', 'expense', '#4C5C68'),
  ('Utilities', 'expense', '#2F6F8F'),
  ('Transport', 'expense', '#C9A227'),
  ('Health', 'expense', '#B42318'),
  ('Shopping', 'expense', '#7C3AED'),
  ('Kids', 'expense', '#DB2777'),
  ('Entertainment', 'expense', '#0F766E'),
  ('Other', 'expense', '#78716C'),
  ('Salary', 'income', '#0F766E'),
  ('Bonus', 'income', '#1D4ED8'),
  ('Other income', 'income', '#3F7D4E');
