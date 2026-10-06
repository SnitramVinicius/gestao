import {storedSettings,professionalAvailable} from '@/lib/company-settings';
import {validateSettings,configuredSchedule} from '@/lib/company-validation';
import {context,json,failure,readJson,checked,changed} from '@/db/runtime';
import {AppError,mutationOrigin,object,text,version,mode,customer,address,orderStatus} from '@/lib/workspace-validation';
import {resolveVisit} from '@/lib/customer-rules';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const {db,tenant}=await context(req);
 const company=checked(await db.from('companies').select('*').eq('id',tenant).single());
 const [cr,or,br,pr,ar]=await Promise.all([
 db.from('customers').select('*').eq('tenant',tenant).order('created_at',{ascending:false}),
 db.from('orders').select('*').eq('tenant',tenant).order('created_at',{ascending:false}),
 db.from('bookings').select('*').eq('tenant',tenant).order('date').order('time'),
 db.from('photos').select('id,order_id,name,mime,size').eq('tenant',tenant).order('created_at'),
 db.from('audit').select('*').eq('tenant',tenant).order('id',{ascending:false}).limit(20)]);
 return json({company:{id:company.id,name:company.name,mode:company.mode,version:company.version,settings:storedSettings(company.settings),hasLogo:!!company.logo_key},
 clients:checked(cr).map(c=>({id:c.id,name:c.name,phone:c.phone,address:c.address,notes:c.notes??'',preferredProfessional:c.preferred_professional_id??'',version:c.version,createdAt:c.created_at})),
 orders:checked(or).map(o=>({id:o.id,customerId:o.customer_id,service:o.service,description:o.description,measurements:o.measurements,responsible:o.responsible,address:o.address,status:o.status,version:o.version,createdAt:o.created_at,updatedAt:o.updated_at})),
 bookings:checked(br).map(b=>({id:b.id,client:b.customer_id,date:b.date,time:b.time,duration:b.duration,kind:b.kind,professional:b.professional_id??undefined,location:b.location,address:b.address,status:b.status,version:b.version})),
 photos:checked(pr).map(p=>({id:p.id,orderId:p.order_id,name:p.name,mime:p.mime,size:p.size})),audit:checked(ar).map(a=>({id:a.id,entity:a.entity,entityId:a.entity_id,action:a.action,createdAt:a.created_at}))});
 }catch(e){return failure(e);}}
export async function POST(req:Request){try{
 mutationOrigin(req);const input=object(await readJson(req)),operation=text(input.operation,40,true),p=object(input.payload);
 const {db,tenant}=await context(req);const company=checked(await db.from('companies').select('*').eq('id',tenant).single());let id:string|undefined;
 if(operation==='saveCompany'){const v=version(p.version);changed(checked(await db.from('companies').update({name:text(p.name,100,true),mode:mode(p.mode),settings:validateSettings(p.settings),version:v+1}).eq('id',tenant).eq('version',v).select('id')));}
 else if(operation==='saveClient'){const c=customer(p,company.mode),notes=text(p.notes,2000),preferredProfessional=text(p.preferredProfessional,80),settings=storedSettings(company.settings);if(preferredProfessional&&!settings.team.some(member=>member.id===preferredProfessional))throw new AppError(400,'Selecione um barbeiro válido.');id=p.id?text(p.id,80,true):crypto.randomUUID();const values={name:c.name,phone:c.phone,address:c.address??null,notes,preferred_professional_id:preferredProfessional||null};if(p.id){const v=version(p.version);changed(checked(await db.from('customers').update({...values,version:v+1}).eq('tenant',tenant).eq('id',id).eq('version',v).select('id')));}else checked(await db.from('customers').insert({...values,id,tenant}));}
 else if(operation==='saveOrder'){const customerId=text(p.customerId,80,true);const c=checked(await db.from('customers').select('id').eq('tenant',tenant).eq('id',customerId).maybeSingle());if(!c)throw new AppError(404,'Cliente não encontrado.');id=p.id?text(p.id,80,true):crypto.randomUUID();const values={customer_id:customerId,service:text(p.service,120,true),description:text(p.description,3000,true),measurements:text(p.measurements,1000),responsible:text(p.responsible,100),address:address(p.address,company.mode==='customer')??null,status:orderStatus(p.status),updated_at:new Date().toISOString()};
 if(p.id){const v=version(p.version);changed(checked(await db.from('orders').update({...values,version:v+1}).eq('tenant',tenant).eq('id',id).eq('version',v).select('id')));}else checked(await db.from('orders').insert({...values,id,tenant}));}
 else if(operation==='setOrderStatus'){const v=version(p.version);changed(checked(await db.from('orders').update({status:orderStatus(p.status),version:v+1,updated_at:new Date().toISOString()}).eq('tenant',tenant).eq('id',text(p.id,80,true)).eq('version',v).select('id')));}
 else if(operation==='createBooking'){const cid=text(p.client,80,true);const c=checked(await db.from('customers').select('address').eq('tenant',tenant).eq('id',cid).maybeSingle());if(!c)throw new AppError(404,'Cliente não encontrado.');if(p.companyVersion!==undefined&&version(p.companyVersion)!==company.version)throw new AppError(409,'Configurações alteradas. Atualize a agenda.');const settings=storedSettings(company.settings),s=configuredSchedule(p,settings),active=settings.team.filter(member=>member.active),requested=text(p.professional,80),professional=active.length>1?active.find(member=>member.id===requested):active[0];if(active.length>1&&!professional)throw new AppError(400,'Selecione um barbeiro.');if(professional&&!professionalAvailable(professional,settings,s.date,s.startMinute,s.duration))throw new AppError(400,'O barbeiro não está disponível nesse horário.');let visit;try{visit=resolveVisit(company.mode,text(p.location,20),c.address??undefined);}catch(e){throw new AppError(400,e instanceof Error?e.message:'Endereço inválido.');}id=crypto.randomUUID();checked(await db.rpc('create_booking',{p_tenant:tenant,p_version:company.version,p_booking:{id,customer_id:cid,date:s.date,time:s.time,start_minute:s.startMinute,duration:s.duration,kind:s.kind,professional_id:professional?.id??null,location:visit.location,address:visit.address??null}}));}
 else if(operation==='rescheduleBooking'){id=text(p.id,80,true);const v=version(p.version),settings=storedSettings(company.settings),s=configuredSchedule(p,settings);const current=checked(await db.from('bookings').select('id,status,professional_id').eq('tenant',tenant).eq('id',id).maybeSingle());if(!current)throw new AppError(404,'Agendamento não encontrado.');if(['Concluído','Cancelado'].includes(current.status))throw new AppError(400,'Este atendimento não pode ser reagendado.');const professional=settings.team.find(member=>member.id===current.professional_id);if(professional&&!professionalAvailable(professional,settings,s.date,s.startMinute,s.duration))throw new AppError(400,'O barbeiro não está disponível nesse horário.');changed(checked(await db.from('bookings').update({date:s.date,time:s.time,start_minute:s.startMinute,duration:s.duration,version:v+1}).eq('tenant',tenant).eq('id',id).eq('version',v).select('id')));}
 else if(operation==='setBookingStatus'){const status=text(p.status,20,true),v=version(p.version);if(!['Confirmado','Concluído','Cancelado'].includes(status))throw new AppError(400,'Status inválido.');const prior=status==='Confirmado'?['Pendente']:status==='Concluído'?['Confirmado']:['Pendente','Confirmado'];changed(checked(await db.from('bookings').update({status,version:v+1}).eq('tenant',tenant).eq('id',text(p.id,80,true)).eq('version',v).in('status',prior).select('id')));}
 else throw new AppError(400,'Operação não reconhecida.');
 return json({ok:true,id});
 }catch(e){return failure(e);}}




