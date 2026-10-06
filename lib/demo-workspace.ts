import type {Workspace,Order} from './workspace-model';
import {defaultSettings} from './company-settings.ts';
import {validateSettings,configuredSchedule} from './company-validation.ts';
import {object,text,version,mode,customer,address,orderStatus,imageMime,AppError} from './workspace-validation.ts';
import {resolveVisit} from './customer-rules.ts';
export function createDemo(){
 const data:Workspace={company:{id:'demo',name:'Minha barbearia',mode:'business',version:1,settings:defaultSettings(),hasLogo:false},clients:[],orders:[],bookings:[],photos:[],audit:[]};
 const assets=new Map<string,string>();
 const fail=(message:string)=>{throw new Error(message);};
 const check=(record:{version:number}|undefined,v:unknown)=>{if(!record||record.version!==version(v))fail('Atualize os dados antes de salvar.');};
 return {
 asset:(path:string)=>assets.get(path)??path,
 async request(path:string,init?:RequestInit):Promise<Response>{
 try{
 if(path==='/api/workspace'&&init?.method!=='POST')return Response.json(data);
 if(path==='/api/photos'||path==='/api/company-logo'){
  if(!(init?.body instanceof FormData))fail('Selecione uma imagem.');
  const form=init!.body as FormData,f=form.get('file');const logo=path==='/api/company-logo';
  if(!(f instanceof File)||!f.size||f.size>(logo?2:4)*1024*1024)fail('Arquivo inválido ou muito grande.');
  const file=f as File;if(imageMime(new Uint8Array(await file.arrayBuffer()))!==file.type)fail('Envie PNG, JPEG ou WebP.');
  const id=crypto.randomUUID();
  if(logo){check(data.company,Number(form.get('version')));data.company.version++;data.company.hasLogo=true;const old=assets.get('logo');if(old)URL.revokeObjectURL(old);assets.set('logo',URL.createObjectURL(file));}
  else{const orderId=String(form.get('orderId'));if(!data.orders.some(o=>o.id===orderId))fail('Pedido não encontrado.');if(data.photos.filter(p=>p.orderId===orderId).length>=5)fail('O pedido já tem 5 fotos.');data.photos.push({id,orderId,name:file.name,mime:file.type,size:file.size});assets.set('/api/photos?id='+id,URL.createObjectURL(file));}
  return Response.json({ok:true,id});
 }
 if(path!=='/api/workspace')fail('Recurso indisponível na demonstração.');
 const input=object(JSON.parse(String(init?.body))),p=object(input.payload),op=input.operation,now=new Date().toISOString();let id=p.id?String(p.id):crypto.randomUUID();
 if(op==='saveCompany'){check(data.company,p.version);data.company={...data.company,name:text(p.name,100,true),mode:mode(p.mode),settings:validateSettings(p.settings),version:data.company.version+1};}
 else if(op==='saveClient'){const c=customer(p,data.company.mode);const existing=data.clients.find(c=>c.id===id);if(p.id)check(existing,p.version);if(data.clients.some(c2=>c2.id!==id&&c2.phone===c.phone))fail('Já existe um cliente com esse telefone.');const next={...c,id,version:(existing?.version??0)+1,createdAt:existing?.createdAt??now};data.clients=existing?data.clients.map(c2=>c2.id===id?next:c2):[next,...data.clients];}
 else if(op==='saveOrder'){if(!data.clients.some(c=>c.id===p.customerId))fail('Cliente não encontrado.');const existing=data.orders.find(o=>o.id===id);if(p.id)check(existing,p.version);const next:Order={id,customerId:String(p.customerId),service:text(p.service,120,true),description:text(p.description,3000,true),measurements:text(p.measurements,1000),responsible:text(p.responsible,100),address:address(p.address,data.company.mode==='customer'),status:orderStatus(p.status),version:(existing?.version??0)+1,createdAt:existing?.createdAt??now,updatedAt:now};data.orders=existing?data.orders.map(o=>o.id===id?next:o):[next,...data.orders];}
 else if(op==='setOrderStatus'){const o=data.orders.find(o=>o.id===id);check(o,p.version);o!.status=orderStatus(p.status);o!.version++;}
 else if(op==='createBooking'){const c=data.clients.find(c=>c.id===p.client);if(!c)fail('Cliente não encontrado.');check(data.company,p.companyVersion);const s=configuredSchedule(p,data.company.settings),visit=resolveVisit(data.company.mode,String(p.location),c!.address),active=data.company.settings.team.filter(member=>member.active),requested=String(p.professional||''),professional=active.length>1?active.find(member=>member.id===requested):active[0];if(active.length>1&&!professional)fail('Selecione um barbeiro.');if(data.bookings.some(b=>b.date===s.date&&(b.professional||'')===(professional?.id||'')&&b.status!=='Cancelado'&&Number(b.time.slice(0,2))*60+Number(b.time.slice(3))<s.startMinute+s.duration&&Number(b.time.slice(0,2))*60+Number(b.time.slice(3))+b.duration>s.startMinute))fail('Esse horário conflita com outro agendamento.');data.bookings.push({id,client:c!.id,date:s.date,time:s.time,duration:s.duration,kind:s.kind,professional:professional?.id,...visit,status:'Pendente',version:1});}
 else if(op==='rescheduleBooking'){const b=data.bookings.find(b=>b.id===id);check(b,p.version);if(['Concluído','Cancelado'].includes(b!.status))fail('Este atendimento não pode ser reagendado.');const s=configuredSchedule(p,data.company.settings);if(data.bookings.some(other=>other.id!==id&&other.date===s.date&&(other.professional||'')===(b!.professional||'')&&other.status!=='Cancelado'&&Number(other.time.slice(0,2))*60+Number(other.time.slice(3))<s.startMinute+s.duration&&Number(other.time.slice(0,2))*60+Number(other.time.slice(3))+other.duration>s.startMinute))fail('Esse horário conflita com outro agendamento.');b!.date=s.date;b!.time=s.time;b!.duration=s.duration;b!.version++;}
 else if(op==='setBookingStatus'){const b=data.bookings.find(b=>b.id===id);check(b,p.version);const status=String(p.status);if(!(b!.status==='Pendente'&&['Confirmado','Cancelado'].includes(status)||b!.status==='Confirmado'&&['Concluído','Cancelado'].includes(status)))fail('Alteração de status inválida.');b!.status=status;b!.version++;}
 else fail('Operação indisponível.');
 data.audit.unshift({id:data.audit.length+1,entity:'Demonstração',entityId:id,action:'Alteração temporária',createdAt:now});
 return Response.json({ok:true,id});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Não foi possível concluir.'},{status:400});}
 },
 logo:()=>assets.get('logo')
 };
}


