begin;
alter table public.customers add column if not exists notes text not null default '';
alter table public.customers add column if not exists preferred_professional_id text;
commit;

