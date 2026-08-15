-- Keep the household at the two existing accounts. New signups are rejected
-- even if the Auth dashboard still has "Allow new users to sign up" on.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create or replace function private.reject_new_signups()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from auth.users) >= 2 then
    raise exception 'Signup is closed. This household already has its two accounts.';
  end if;

  if lower(coalesce(new.email, '')) not in (
    'zanugreuu@gmail.com',
    'toma_roxanaelena@yahoo.com'
  ) then
    raise exception 'Signup is closed. This household already has its two accounts.';
  end if;

  return new;
end;
$$;

revoke all on function private.reject_new_signups() from public, anon, authenticated;

drop trigger if exists reject_new_signups on auth.users;
create trigger reject_new_signups
  before insert on auth.users
  for each row execute function private.reject_new_signups();
