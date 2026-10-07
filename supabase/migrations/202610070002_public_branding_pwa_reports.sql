begin;

alter table public.companies add column if not exists slug text;
create unique index if not exists companies_slug_unique on public.companies(slug) where slug is not null;
alter table public.companies drop constraint if exists companies_slug_format;
alter table public.companies add constraint companies_slug_format check(slug is null or slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check check(status in ('Pendente','Confirmado','Concluído','Cancelado','Faltou'));

commit;
