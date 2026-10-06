import {adminClient,checked,changed,json,failure,readJson} from '@/db/runtime';
import {storedSettings,defaultSettings} from '@/lib/company-settings';
import {AppError,mutationOrigin,object,text} from '@/lib/workspace-validation';

export const dynamic='force-dynamic';
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){try{
 const token=(await params).token;
 if(token.startsWith('demo-')){const id=token.slice(5),settings=defaultSettings(),barber={id,name:id==='barbeiro-carlos'?'Carlos':'João',role:'Barbeiro'};return json({company:'Barbearia demonstração',barber,timezone:settings.timezone,bookings:[]});}
 if(!/^[0-9a-f]{48}$/.test(token))throw new AppError(404,'Acesso não encontrado.');
 const db=adminClient(),access=checked(await db.from('barber_access').select('tenant,professional_id').eq('token_hash',await hash(token)).maybeSingle());
 if(!access)throw new AppError(404,'Este acesso não está mais disponível.');
 const company=checked(await db.from('companies').select('name,settings').eq('id',access.tenant).maybeSingle());
 if(!company)throw new AppError(404,'Barbearia não encontrada.');
 const settings=storedSettings(company.settings),barber=settings.team.find(member=>member.id===access.professional_id&&member.active);
 if(!barber)throw new AppError(403,'Este acesso foi desativado.');
 const from=new Date(Date.now()-86400000).toISOString().slice(0,10),until=new Date(Date.now()+60*86400000).toISOString().slice(0,10);
 const bookings=checked(await db.from('bookings').select('id,customer_id,date,time,duration,kind,status').eq('tenant',access.tenant).eq('professional_id',barber.id).gte('date',from).lte('date',until).neq('status','Cancelado').order('date').order('time'));
 const customerIds=[...new Set(bookings.map(booking=>booking.customer_id))],customers=customerIds.length?checked(await db.from('customers').select('id,name,phone').eq('tenant',access.tenant).in('id',customerIds)):[];
 return json({company:company.name,barber:{id:barber.id,name:barber.name,role:barber.role},timezone:settings.timezone,bookings:bookings.map(booking=>({...booking,customer:customers.find(customer=>customer.id===booking.customer_id)??{name:'Cliente',phone:''}}))});
 }catch(error){return failure(error);}}

export async function POST(request:Request,{params}:{params:Promise<{token:string}>}){try{
 mutationOrigin(request);const token=(await params).token,payload=object(await readJson(request)),bookingId=text(payload.bookingId,80,true),action=text(payload.action,20,true);
 if(token.startsWith('demo-'))return json({ok:true});
 if(!/^[0-9a-f]{48}$/.test(token))throw new AppError(404,'Acesso não encontrado.');
 const db=adminClient(),access=checked(await db.from('barber_access').select('tenant,professional_id').eq('token_hash',await hash(token)).maybeSingle());
 if(!access)throw new AppError(404,'Este acesso não está mais disponível.');
 const booking=checked(await db.from('bookings').select('id,status,version').eq('id',bookingId).eq('tenant',access.tenant).eq('professional_id',access.professional_id).maybeSingle());
 if(!booking)throw new AppError(404,'Agendamento não encontrado.');
 const status=action==='confirm'?'Confirmado':action==='refuse'?'Cancelado':action==='complete'?'Concluído':'';
 if(!status)throw new AppError(400,'Ação inválida.');
 if(status==='Confirmado'&&booking.status!=='Pendente'||status==='Concluído'&&booking.status!=='Confirmado'||status==='Cancelado'&&!['Pendente','Confirmado'].includes(booking.status))throw new AppError(400,'Este agendamento já foi alterado.');
 changed(checked(await db.from('bookings').update({status,version:booking.version+1}).eq('id',booking.id).eq('version',booking.version).select('id')));
 return json({ok:true});
 }catch(error){return failure(error);}}

