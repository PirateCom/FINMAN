-- Default household currency to SEK (öre stored as integer cents, same as before).

alter table public.settings
  alter column currency set default 'SEK';

update public.settings
set currency = 'SEK', updated_at = now()
where id = 1;
