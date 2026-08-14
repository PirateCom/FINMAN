-- Household savings is a single editable total (starts at 0).

alter table public.settings
  add column if not exists savings_bani integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'settings_savings_bani_nonneg'
  ) then
    alter table public.settings
      add constraint settings_savings_bani_nonneg check (savings_bani >= 0);
  end if;
end $$;
