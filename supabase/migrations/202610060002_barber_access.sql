begin;
create table if not exists public.barber_access (
 id text primary key,
 tenant uuid not null references public.companies(id) on delete cascade,
 professional_id text not null,
 token_hash text not null unique,
 created_at timestamptz not null default now(),
 unique(tenant,professional_id)
);
create index if not exists barber_access_tenant on public.barber_access(tenant);
alter table public.barber_access enable row level security;
revoke all on public.barber_access from anon,authenticated;
grant all on public.barber_access to service_role;
commit;

