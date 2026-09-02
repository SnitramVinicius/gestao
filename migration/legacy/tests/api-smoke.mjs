// Backend integration test for the LOCAL Sites simulator only. Creates clearly marked local fixtures.
import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const base='http://localhost:3000';const cookie='__sites_local_auth=1';
const suffix=String(Date.now());const address={street:'Rua Teste Local',number:'100',neighborhood:'Centro',city:'São Paulo',state:'SP',postalCode:'',complement:''};
async function call(operation,payload,expected=200){const res=await fetch(base+'/api/workspace',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({operation,payload})});const data=await res.json();assert.equal(res.status,expected,JSON.stringify(data));return data;}
async function state(){const res=await fetch(base+'/api/workspace',{headers:{Cookie:cookie},cache:'no-store'});const data=await res.json();assert.equal(res.status,200,JSON.stringify(data));assert.equal(data.company.id,'local_seedy','Tests may run only on the local simulator');return data;}
assert.equal((await fetch(base+'/api/workspace')).status,401);
assert.equal((await fetch(base+'/api/workspace',{headers:{'oai-authenticated-user-id':'forged'}})).status,401);
await state();
assert.equal((await fetch(base+'/api/workspace',{method:'POST',headers:{Cookie:cookie,Origin:'https://other.example','Content-Type':'application/json'},body:JSON.stringify({operation:'saveClient',payload:{}})})).status,403);
await call('saveClient',{name:'Teste',phone:'11999999999'},400);
const client=(await call('saveClient',{name:'Cliente de teste local '+suffix,phone:'11'+suffix.slice(-9),address})).id;
const order=(await call('saveOrder',{customerId:client,service:'Box (teste local)',description:'Pedido criado pelo teste de integração local.',measurements:'1,20 m x 1,90 m',responsible:'Teste',address,status:'Novo'})).id;
let data=await state();assert.ok(data.clients.some(c=>c.id===client));assert.ok(data.orders.some(o=>o.id===order));
const customer=data.clients.find(c=>c.id===client);
await call('saveClient',{...customer,name:'Cliente teste atualizado '+suffix});
await call('saveClient',{...customer,name:'Atualização desatualizada'},409);
await call('saveOrder',{customerId:'nonexistent',service:'Teste',description:'Teste',status:'Novo',address},404);
const bookingPayload={client,date:'2099-01-02',time:'09:00',duration:60,kind:'Medição',location:'customer'};
const responses=await Promise.all([fetch(base+'/api/workspace',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({operation:'createBooking',payload:bookingPayload})}),fetch(base+'/api/workspace',{method:'POST',headers:{Cookie:cookie,Origin:base,'Content-Type':'application/json'},body:JSON.stringify({operation:'createBooking',payload:bookingPayload})})]);
assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);
const savedBooking=await responses.find(r=>r.status===200).json();
data=await state();const booking=data.bookings.find(b=>b.id===savedBooking.id);assert.equal(booking.address.street,address.street);
await call('setBookingStatus',{id:booking.id,version:booking.version,status:'Cancelado'});
const form=new FormData();form.set('orderId',order);form.set('file',new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64')],'teste-local.png',{type:'image/png'}));
const upload=await fetch(base+'/api/photos',{method:'POST',headers:{Cookie:cookie,Origin:base},body:form});const photo=await upload.json();assert.equal(upload.status,200,JSON.stringify(photo));
assert.equal((await fetch(base+'/api/photos?id='+photo.id)).status,401);
const download=await fetch(base+'/api/photos?id='+photo.id,{headers:{Cookie:cookie}});assert.equal(download.status,200);assert.equal(download.headers.get('content-type'),'image/png');
data=await state();assert.ok(data.photos.some(p=>p.id===photo.id&&p.orderId===order));assert.ok(data.audit.some(a=>a.entityId===order));
await writeFile('tests/.local-fixture.json',JSON.stringify({client,order,booking:booking.id,photo:photo.id}));
console.log('API: autenticação, origem, cliente e pedido persistentes, edição concorrente, conflito simultâneo de agenda, upload e foto protegida: OK');
