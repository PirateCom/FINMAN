-- Amounts stay stored in base_currency; settings.currency is what the app shows.

alter table public.settings
  add column if not exists base_currency text not null default 'SEK';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'settings_base_currency_allowed'
  ) then
    alter table public.settings
      add constraint settings_base_currency_allowed
      check (base_currency in ('SEK', 'EUR', 'RON'));
  end if;
end $$;
