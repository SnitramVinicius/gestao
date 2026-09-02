import {storedSettings} from '@/lib/company-settings';
import {validateSettings,configuredSchedule} from '@/lib/company-validation';
import {context,json,failure,readJson} from '@/db/runtime';
import {AppError,mutationOrigin,object,text,version,mode,customer,address,orderStatus,schedule} from '@/lib/workspace-validation';
import {resolveVisit,type AttendanceMode,type Address} from '@/lib/customer-rules';
export const dynamic='force-dynamic';
function parseAddress(value:unknown):Address|undefined{return typeof value==='string'?JSON.parse(value):undefined;}
export async function GET(req:Request){try{
 const {db,tenant}=await context(req);
 const company=await db.prepare('SELECT id,name,mode,version,settings,logo_key FROM companies WHERE id=?').bind(tenant).first();
 const [clients,orders,bookings,photos,audit]=await Promise.all([
 db.prepare('SELECT id,name,phone,address,version,created_at FROM customers WHERE tenant=? ORDER BY created_at DESC').bind(tenant).all(),
 db.prepare('SELECT * FROM orders WHERE tenant=? ORDER BY created_at DESC').bind(tenant).all(),
 db.prepare('SELECT * FROM bookings WHERE tenant=? ORDER BY date,time').bind(tenant).all(),
 db.prepare('SELECT id,order_id,name,mime,size FROM photos WHERE tenant=? ORDER BY created_at').bind(tenant).all(),
 db.prepare('SELECT id,entity,entity_id,action,created_at FROM audit WHERE tenant=? ORDER BY id DESC LIMIT 20').bind(tenant).all()]);
 return json({company:company?{id:company.id,name:company.name,mode:company.mode,version:company.version,settings:storedSettings(company.settings),hasLogo:!!company.logo_key}:null,clients:clients.results.map(c=>({id:c.id,name:c.name,phone:c.phone,address:parseAddress(c.address),version:c.version,createdAt:c.created_at})),orders:orders.results.map(o=>({id:o.id,customerId:o.customer_id,service:o.service,description:o.description,measurements:o.measurements,responsible:o.responsible,address:parseAddress(o.address),status:o.status,version:o.version,createdAt:o.created_at,updatedAt:o.updated_at})),bookings:bookings.results.map(b=>({id:b.id,client:b.customer_id,date:b.date,time:b.time,duration:b.duration,kind:b.kind,location:b.location,address:parseAddress(b.address),status:b.status,version:b.version})),photos:photos.results.map(p=>({id:p.id,orderId:p.order_id,name:p.name,mime:p.mime,size:p.size})),audit:audit.results.map(a=>({id:a.id,entity:a.entity,entityId:a.entity_id,action:a.action,createdAt:a.created_at}))});
 }catch(error){return failure(error);}}
export async function POST(req:Request){try{
 mutationOrigin(req);const input=object(await readJson(req));const operation=text(input.operation,40,true);const p=object(input.payload);
 const {db,tenant}=await context(req);const company=await db.prepare('SELECT mode,settings,version FROM companies WHERE id=?').bind(tenant).first<{mode:AttendanceMode;settings:string|null;version:number}>();if(!company)throw new AppError(404,'Empresa não encontrada.');
 const now=new Date().toISOString();let changed:number|undefined;let id:string|undefined;
 if(operation==='saveCompany'){const name=text(p.name,100,true);const attendance=mode(p.mode);const settings=validateSettings(p.settings);const result=await db.prepare('UPDATE companies SET name=?,mode=?,settings=?,version=version+1 WHERE id=? AND version=?').bind(name,attendance,JSON.stringify(settings),tenant,version(p.version)).run();changed=result.meta.changes;}
 else if(operation==='saveClient'){const c=customer(p,company.mode);id=p.id?text(p.id,80,true):crypto.randomUUID();if(p.id){const result=await db.prepare('UPDATE customers SET name=?,phone=?,address=?,version=version+1 WHERE id=? AND tenant=? AND version=?').bind(c.name,c.phone,c.address?JSON.stringify(c.address):null,id,tenant,version(p.version)).run();changed=result.meta.changes;}else{await db.prepare('INSERT INTO customers (id,tenant,name,phone,address,created_at) VALUES (?,?,?,?,?,?)').bind(id,tenant,c.name,c.phone,c.address?JSON.stringify(c.address):null,now).run();}}
 else if(operation==='saveOrder'){
 const customerId=text(p.customerId,80,true);const c=await db.prepare('SELECT id,address FROM customers WHERE id=? AND tenant=?').bind(customerId,tenant).first();if(!c)throw new AppError(404,'Cliente não encontrado.');
 const a=address(p.address,company.mode==='customer');const service=text(p.service,120,true),description=text(p.description,3000,true),measurements=text(p.measurements,1000),responsible=text(p.responsible,100),status=orderStatus(p.status);
 id=p.id?text(p.id,80,true):crypto.randomUUID();
 if(p.id){const result=await db.prepare('UPDATE orders SET customer_id=?,service=?,description=?,measurements=?,responsible=?,address=?,status=?,updated_at=?,version=version+1 WHERE id=? AND tenant=? AND version=?').bind(customerId,service,description,measurements,responsible,a?JSON.stringify(a):null,status,now,id,tenant,version(p.version)).run();changed=result.meta.changes;}
 else{await db.prepare('INSERT INTO orders (id,tenant,customer_id,service,description,measurements,responsible,address,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id,tenant,customerId,service,description,measurements,responsible,a?JSON.stringify(a):null,status,now,now).run();}
 }
 else if(operation==='setOrderStatus'){const result=await db.prepare('UPDATE orders SET status=?,updated_at=?,version=version+1 WHERE id=? AND tenant=? AND version=?').bind(orderStatus(p.status),now,text(p.id,80,true),tenant,version(p.version)).run();changed=result.meta.changes;}
 else if(operation==='createBooking'){const customerId=text(p.client,80,true);const c=await db.prepare('SELECT address FROM customers WHERE id=? AND tenant=?').bind(customerId,tenant).first();if(!c)throw new AppError(404,'Cliente não encontrado.');if(p.companyVersion!==undefined&&version(p.companyVersion)!==company.version)throw new AppError(409,'Configurações alteradas. Atualize a agenda.');const s=configuredSchedule(p,storedSettings(company.settings));let visit;try{visit=resolveVisit(company.mode,text(p.location,20),parseAddress(c.address));}catch(error){throw new AppError(400,error instanceof Error?error.message:'Endereço inválido.');}id=crypto.randomUUID();const result=await db.prepare('INSERT INTO bookings (id,tenant,customer_id,date,time,start_minute,duration,kind,location,address,status) SELECT ?,?,?,?,?,?,?,?,?,?,? FROM companies WHERE id=? AND version=?').bind(id,tenant,customerId,s.date,s.time,s.startMinute,s.duration,s.kind,visit.location,visit.address?JSON.stringify(visit.address):null,'Pendente',tenant,company.version).run();changed=result.meta.changes;}
 else if(operation==='setBookingStatus'){const status=text(p.status,20,true);if(!['Confirmado','Concluído','Cancelado'].includes(status))throw new AppError(400,'Status inválido.');const result=await db.prepare(`UPDATE bookings SET status=?,version=version+1 WHERE id=? AND tenant=? AND version=? AND ((status='Pendente' AND ? IN ('Confirmado','Cancelado')) OR (status='Confirmado' AND ? IN ('Concluído','Cancelado')))`).bind(status,text(p.id,80,true),tenant,version(p.version),status,status).run();changed=result.meta.changes;}
 else throw new AppError(400,'Operação não reconhecida.');
 if(changed===0)throw new AppError(409,'O registro foi alterado ou não está disponível. Atualize os dados antes de tentar novamente.');
 return json({ok:true,id});
 }catch(error){return failure(error);}}
