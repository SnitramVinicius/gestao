import {PGlite} from '@electric-sql/pglite';
import {btree_gist} from '@electric-sql/pglite/contrib/btree_gist';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const db=new PGlite({extensions:{btree_gist}});
await db.exec("create role anon;create role authenticated;create role service_role bypassrls;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);");
await db.exec(await readFile(new URL('../supabase/migrations/202609020001_orbita.sql',import.meta.url),'utf8'));
const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002';
await db.query("insert into companies(id,name,mode) values($1,'A','business'),($2,'B','business')",[a,b]);
await db.query("insert into customers(id,tenant,name,phone) values('a',$1,'A','11999999999'),('b',$2,'B','11999999999')",[a,b]);
async function fail(sql,params,code){try{await db.query(sql,params);assert.fail('Expected rejection');}catch(e){assert.equal(e.code,code,e.message);}}
await fail("insert into orders(id,tenant,customer_id,service,description,status) values('bad',$1,'b','S','D','Novo')",[a],'23503');
await db.query("insert into orders(id,tenant,customer_id,service,description,status) values('order-a',$1,'a','S','D','Novo')",[a]);
const booking=(id,time,start,duration=30)=>({id,customer_id:'a',date:'2026-09-02',time,start_minute:start,duration,kind:'S',location:'business'});
await db.query('select create_booking($1,1,$2::jsonb)',[a,JSON.stringify(booking('one','09:00',540))]);
await fail('select create_booking($1,1,$2::jsonb)',[a,JSON.stringify(booking('overlap','09:15',555))],'23P01');
await db.query('select create_booking($1,1,$2::jsonb)',[a,JSON.stringify(booking('adjacent','09:30',570))]);
await fail('select create_booking($1,2,$2::jsonb)',[a,JSON.stringify(booking('stale','10:00',600))],'P0001');
await db.query("update bookings set status='Cancelado' where id='one'");
await db.query('select create_booking($1,1,$2::jsonb)',[a,JSON.stringify(booking('replacement','09:00',540))]);
const first=await db.query('update customers set version=version+1 where id=$1 and tenant=$2 and version=1 returning id',['a',a]);assert.equal(first.rows.length,1);
const stale=await db.query('update customers set version=version+1 where id=$1 and tenant=$2 and version=1 returning id',['a',a]);assert.equal(stale.rows.length,0);
for(let i=0;i<5;i++)await db.query("insert into photos(id,tenant,order_id,object_key,name,mime,size) values($1,$2,'order-a',$1,'photo','image/png',10)",['p'+i,a]);
await fail("insert into photos(id,tenant,order_id,object_key,name,mime,size) values('p6',$1,'order-a','p6','photo','image/png',10)",[a],'P0001');
for(const role of ['anon','authenticated']){
 await db.exec('set role '+role);
 await fail('select * from companies',[],'42501');
 await fail('select create_booking($1,1,$2::jsonb)',[a,JSON.stringify(booking('attack','11:00',660))],'42501');
 await fail("insert into customers(id,tenant,name,phone) values('attack',$1,'X','123')",[a],'42501');
 await db.exec('reset role');
}
assert.equal((await db.query("select public from storage.buckets where id='orbita-files'")).rows[0].public,false);
assert.ok((await db.query('select count(*)::int as n from audit')).rows[0].n>=10);
await db.close();console.log('PostgreSQL migration, private bucket, role permissions, tenant foreign keys, overlap, cancellation, versions and photo limits: PASS');
