import {adminClient,checked,changed,json,failure,readJson} from '@/db/runtime';
import {storedSettings,businessDay,minute,professionalAvailable,professionalHours} from '@/lib/company-settings';
import {AppError,mutationOrigin,object,text} from '@/lib/workspace-validation';

export const dynamic='force-dynamic';
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
const validToken=(value:string)=>{if(!/^[0-9a-f]{48}$/.test(value))throw new AppError(404,'Agendamento não encontrado.');return value;};
const validDate=(value:unknown)=>{const date=text(value,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)throw new AppError(400,'Escolha uma data válida.');return date;};
const validTime=(value:unknown)=>{const time=text(value,5,true);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new AppError(400,'Escolha um horário válido.');return time;};

async function load(token:string){
 const db=adminClient(),booking=checked(await db.from('bookings').select('*').eq('public_token_hash',await hash(validToken(token))).maybeSingle());
 if(!booking)throw new AppError(404,'Agendamento não encontrado.');
 const company=checked(await db.from('companies').select('name,settings').eq('id',booking.tenant).single()),settings=storedSettings(company.settings);
 const customer=checked(await db.from('customers').select('name,phone').eq('tenant',booking.tenant).eq('id',booking.customer_id).single());
 const barber=settings.team.find(member=>member.id===booking.professional_id);
 return {db,booking,company,settings,customer,barber};
}
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){try{
 const token=(await params).token;if(token.startsWith('demo-'))return json({company:'Barbearia demonstração',customer:'Cliente demonstração',booking:{id:'demo',date:new Date().toISOString().slice(0,10),time:'10:00',duration:45,kind:'Corte',status:'Pendente',professional:'João'},hours:[],bookings:[]});
 const {db,booking,company,settings,customer,barber}=await load(token);
 const from=new Date().toISOString().slice(0,10),until=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
 const occupied=checked(await db.from('bookings').select('id,date,time,duration,status').eq('tenant',booking.tenant).eq('professional_id',booking.professional_id).gte('date',from).lte('date',until).neq('status','Cancelado').neq('id',booking.id));
 return json({company:company.name,customer:customer.name,timezone:settings.timezone,booking:{id:booking.id,date:booking.date,time:booking.time,duration:booking.duration,kind:booking.kind,status:booking.status,professional:barber?.name??''},hours:professionalHours(barber,settings),blocks:barber?.blocks??[],bookings:occupied});
 }catch(error){return failure(error);}}
export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){try{
 mutationOrigin(request);const token=(await params).token,payload=object(await readJson(request)),action=text(payload.action,20,true);if(token.startsWith('demo-'))return json({ok:true});
 const {db,booking,settings,barber}=await load(token);
 if(action==='cancel'){if(!['Pendente','Confirmado'].includes(booking.status))throw new AppError(400,'Este agendamento não pode mais ser cancelado.');changed(checked(await db.from('bookings').update({status:'Cancelado',version:booking.version+1}).eq('id',booking.id).eq('version',booking.version).select('id')));}
 else if(action==='reschedule'){if(!['Pendente','Confirmado'].includes(booking.status))throw new AppError(400,'Este agendamento não pode mais ser reagendado.');const date=validDate(payload.date),time=validTime(payload.time),day=businessDay(date,settings),start=minute(time),end=start+booking.duration,localToday=new Intl.DateTimeFormat('en-CA',{timeZone:settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());if(date<localToday)throw new AppError(400,'Escolha uma data a partir de hoje.');if(!day?.enabled||start<minute(day.open)||end>minute(day.close)||(day.breakStart&&start<minute(day.breakEnd)&&end>minute(day.breakStart)))throw new AppError(400,'Esse horário não está dentro do expediente.');if(barber&&!professionalAvailable(barber,settings,date,start,booking.duration))throw new AppError(400,'O barbeiro não está disponível nesse horário.');changed(checked(await db.from('bookings').update({date,time,start_minute:start,status:'Pendente',version:booking.version+1}).eq('id',booking.id).eq('version',booking.version).select('id')));}
 else throw new AppError(400,'Ação inválida.');
 return json({ok:true});
 }catch(error){return failure(error);}}


