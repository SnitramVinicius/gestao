import {adminClient,checked,json,failure,readJson} from '@/db/runtime';
import {storedSettings,defaultSettings,businessDay,minute,professionalAvailable} from '@/lib/company-settings';
import {AppError,mutationOrigin,object,text} from '@/lib/workspace-validation';

export const dynamic='force-dynamic';
const companyId=(value:string)=>{if(value==='demo')return value;if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))throw new AppError(404,'Barbearia não encontrada.');return value;};
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(24))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
const validDate=(value:unknown)=>{const date=text(value,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new AppError(400,'Escolha uma data válida.');return date;};
const validTime=(value:unknown)=>{const time=text(value,5,true);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new AppError(400,'Escolha um horário válido.');return time;};

export async function GET(_request:Request,{params}:{params:Promise<{empresa:string}>}){try{
 const tenant=companyId((await params).empresa);if(tenant==='demo'){const settings=defaultSettings(),team=[{id:'barbeiro-joao',name:'João',role:'Barbeiro'},{id:'barbeiro-carlos',name:'Carlos',role:'Barbeiro'}];return json({company:{id:'demo',name:'Barbearia demonstração',timezone:settings.timezone,hours:settings.hours,services:settings.services,team},bookings:[]});}const db=adminClient();
 const company=checked(await db.from('companies').select('id,name,settings').eq('id',tenant).maybeSingle());
 if(!company)throw new AppError(404,'Barbearia não encontrada.');
 const settings=storedSettings(company.settings);
 const from=new Date().toISOString().slice(0,10),until=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
 const rows=checked(await db.from('bookings').select('date,time,duration,status,professional_id').eq('tenant',tenant).gte('date',from).lte('date',until).neq('status','Cancelado'));
 return json({company:{id:company.id,name:company.name,timezone:settings.timezone,hours:settings.hours,services:settings.services.filter(service=>service.active).map(({id,name,description,duration,price,pricingModel})=>({id,name,description,duration,price,pricingModel})),team:settings.team.filter(member=>member.active).map(({id,name,role,hours,blocks})=>({id,name,role,hours,blocks}))},bookings:rows.map(row=>({...row,professional:row.professional_id??undefined}))});
 }catch(error){return failure(error);}}

export async function POST(request:Request,{params}:{params:Promise<{empresa:string}>}){try{
 mutationOrigin(request);const tenant=companyId((await params).empresa),payload=object(await readJson(request));if(tenant==='demo')return json({ok:true,id:crypto.randomUUID(),token:'demo-'+token(),message:'Horário solicitado na demonstração.'});const db=adminClient();
 const company=checked(await db.from('companies').select('id,name,version,settings').eq('id',tenant).maybeSingle());
 if(!company)throw new AppError(404,'Barbearia não encontrada.');
 const settings=storedSettings(company.settings),name=text(payload.name,100,true),phone=text(payload.phone,20,true).replace(/\D/g,'');
 if(!/^\d{10,11}$/.test(phone))throw new AppError(400,'Informe um telefone com DDD.');
 if(!Array.isArray(payload.services)||payload.services.length<1||payload.services.length>10)throw new AppError(400,'Escolha pelo menos um serviço.');
 const ids=[...new Set(payload.services.map(value=>text(value,80,true)))],services=ids.map(id=>settings.services.find(service=>service.id===id&&service.active));
 if(services.some(service=>!service))throw new AppError(400,'Um dos serviços selecionados não está disponível.');
 const selected=services.filter(Boolean) as typeof settings.services,total=selected.reduce((sum,service)=>sum+service.duration,0),active=settings.team.filter(member=>member.active),requested=text(payload.professional,80),professional=active.length>1?active.find(member=>member.id===requested):active[0];if(active.length>1&&!professional)throw new AppError(400,'Selecione um barbeiro.');
 if(total>480)throw new AppError(400,'A duração total dos serviços é muito longa.');
 const date=validDate(payload.date),time=validTime(payload.time),day=businessDay(date,settings),start=minute(time),end=start+total;
 const localToday=new Intl.DateTimeFormat('en-CA',{timeZone:settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 if(date<localToday)throw new AppError(400,'Escolha uma data a partir de hoje.');
 if(!day?.enabled||start<minute(day.open)||end>minute(day.close)||(day.breakStart&&start<minute(day.breakEnd)&&end>minute(day.breakStart)))throw new AppError(400,'Esse horário não está dentro do expediente.');if(professional&&!professionalAvailable(professional,settings,date,start,total))throw new AppError(400,'O barbeiro não está disponível nesse horário.');
 let customer=checked(await db.from('customers').select('id,name,version').eq('tenant',tenant).eq('phone',phone).maybeSingle());
 if(customer){if(customer.name!==name)checked(await db.from('customers').update({name,version:customer.version+1}).eq('tenant',tenant).eq('id',customer.id));}
 else{const id=crypto.randomUUID();checked(await db.from('customers').insert({id,tenant,name,phone}));customer={id,name,version:1};}
 const id=crypto.randomUUID(),kind=selected.map(service=>service.name).join(' + ').slice(0,300),statusToken=token();
 checked(await db.rpc('create_booking',{p_tenant:tenant,p_version:company.version,p_booking:{id,customer_id:customer.id,date,time,start_minute:start,duration:total,kind,professional_id:professional?.id??null,public_token_hash:await hash(statusToken),location:'business',address:null}}));
 return json({ok:true,id,token:statusToken,message:'Horário solicitado com sucesso.'});
 }catch(error){return failure(error);}}








