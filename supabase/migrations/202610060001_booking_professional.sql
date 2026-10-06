begin;
alter table public.bookings add column if not exists professional_id text;
alter table public.bookings drop constraint if exists booking_overlap;
alter table public.bookings
 add constraint booking_overlap exclude using gist(
  tenant with =,
  date with =,
  (coalesce(professional_id,'__solo__')) with =,
  int4range(start_minute,start_minute+duration,'[)') with &&
 ) where (status<>'Cancelado');

create or replace function public.create_booking(p_tenant uuid,p_version integer,p_booking jsonb) returns void
 language plpgsql set search_path='' as $$
declare current_version integer;
begin
 select version into current_version from public.companies where id=p_tenant for update;
 if current_version is null or current_version<>p_version then raise exception 'stale_company';end if;
 insert into public.bookings(id,tenant,customer_id,date,time,start_minute,duration,kind,professional_id,location,address,status)
 values(p_booking->>'id',p_tenant,p_booking->>'customer_id',(p_booking->>'date')::date,p_booking->>'time',
 (p_booking->>'start_minute')::integer,(p_booking->>'duration')::integer,p_booking->>'kind',nullif(p_booking->>'professional_id',''),
 p_booking->>'location',nullif(p_booking->'address','null'::jsonb),'Pendente');
end $$;
revoke all on function public.create_booking(uuid,integer,jsonb) from public,anon,authenticated;
grant execute on function public.create_booking(uuid,integer,jsonb) to service_role;
commit;

