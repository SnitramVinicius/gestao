begin;
create table if not exists public.client_plans (
 id text primary key,
 tenant uuid not null references public.companies(id) on delete cascade,
 customer_id text not null,
 service_id text not null,
 service_name text not null,
 included_uses integer not null check(included_uses between 1 and 100),
 used_uses integer not null default 0 check(used_uses between 0 and 100),
 renews_on date not null,
 active boolean not null default true,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 unique(tenant,id),
 foreign key(tenant,customer_id) references public.customers(tenant,id)
);
create index if not exists client_plans_tenant_renewal on public.client_plans(tenant,renews_on);
alter table public.client_plans enable row level security;
revoke all on public.client_plans from anon,authenticated;
grant all on public.client_plans to service_role;
drop trigger if exists client_plans_audit on public.client_plans;
create trigger client_plans_audit after insert or update on public.client_plans for each row execute function public.record_change();
commit;

