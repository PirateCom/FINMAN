-- Household users (visible in Table Editor). Linked to Authentication → Users.

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default 'Family member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Copy from old profiles table if it exists
do $$
begin
  if to_regclass('public.profiles') is not null then
    insert into public.users (id, display_name, created_at)
    select id, display_name, created_at
    from public.profiles
    on conflict (id) do nothing;
  end if;
end $$;

-- Backfill email from Auth
update public.users u
set email = au.email
from auth.users au
where au.id = u.id
  and (u.email is null or u.email = '');

-- Point existing FKs at users instead of profiles
do $$
begin
  if to_regclass('public.categories') is not null then
    alter table public.categories drop constraint if exists categories_created_by_fkey;
    begin
      alter table public.categories
        add constraint categories_created_by_fkey
        foreign key (created_by) references public.users (id) on delete set null;
    exception
      when duplicate_object then null;
    end;
  end if;

  if to_regclass('public.transactions') is not null then
    alter table public.transactions drop constraint if exists transactions_entered_by_fkey;
    begin
      alter table public.transactions
        add constraint transactions_entered_by_fkey
        foreign key (entered_by) references public.users (id) on delete restrict;
    exception
      when duplicate_object then null;
    end;
  end if;
end $$;

drop table if exists public.profiles;

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
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rows for people already in Auth
insert into public.users (id, email, display_name)
select
  id,
  email,
  coalesce(nullif(raw_user_meta_data->>'display_name', ''), split_part(email, '@', 1), 'Family member')
from auth.users
on conflict (id) do update
  set email = excluded.email;

alter table public.users enable row level security;

drop policy if exists "household read users" on public.users;
drop policy if exists "own user insert" on public.users;
drop policy if exists "own user update" on public.users;
drop policy if exists "household read profiles" on public.users;
drop policy if exists "own profile insert" on public.users;
drop policy if exists "own profile update" on public.users;

create policy "household read users" on public.users
  for select to authenticated using (true);

create policy "own user insert" on public.users
  for insert to authenticated with check (auth.uid() = id);

create policy "own user update" on public.users
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
