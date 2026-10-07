import type {Workspace,Order,ClientPlan} from './workspace-model';
import {defaultSettings,professionalAvailable} from './company-settings.ts';
import {validateSettings,configuredSchedule} from './company-validation.ts';
import {object,text,version,mode,customer,address,orderStatus,imageMime,AppError} from './workspace-validation.ts';
import {resolveVisit} from './customer-rules.ts';
export function createDemo(){
 const data:Workspace={company:{id:'demo',name:'Minha barbearia',slug:'minha-barbearia',mode:'business',version:1,settings:defaultSettings(),hasLogo:false},clients:[],orders:[],bookings:[],plans:[],photos:[],audit:[]};
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
 if(op==='saveCompany'){check(data.company,p.version);const name=text(p.name,100,true),slug=text(p.slug,60)||data.company.slug||name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))fail('Use apenas letras minúsculas, números e hífens no link.');data.company={...data.company,name,slug,mode:mode(p.mode),settings:validateSettings(p.settings),version:data.company.version+1};}
 else if(op==='saveClient'){const c=customer(p,data.company.mode);const existing=data.clients.find(c=>c.id===id);if(p.id)check(existing,p.version);if(data.clients.some(c2=>c2.id!==id&&c2.phone===c.phone))fail('Já existe um cliente com esse telefone.');const next={...c,notes:String(p.notes||''),preferredProfessional:String(p.preferredProfessional||''),id,version:(existing?.version??0)+1,createdAt:existing?.createdAt??now};data.clients=existing?data.clients.map(c2=>c2.id===id?next:c2):[next,...data.clients];}
 else if(op==='deleteClient'){const existing=data.clients.find(c=>c.id===id);check(existing,p.version);const orderIds=data.orders.filter(item=>item.customerId===id).map(item=>item.id);data.photos=data.photos.filter(item=>!orderIds.includes(item.orderId));data.orders=data.orders.filter(item=>item.customerId!==id);data.bookings=data.bookings.filter(item=>item.client!==id);data.plans=data.plans.filter(item=>item.customerId!==id);data.clients=data.clients.filter(item=>item.id!==id);}
 else if(op==='saveOrder'){if(!data.clients.some(c=>c.id===p.customerId))fail('Cliente não encontrado.');const existing=data.orders.find(o=>o.id===id);if(p.id)check(existing,p.version);const next:Order={id,customerId:String(p.customerId),service:text(p.service,120,true),description:text(p.description,3000,true),measurements:text(p.measurements,1000),responsible:text(p.responsible,100),address:address(p.address,data.company.mode==='customer'),status:orderStatus(p.status),version:(existing?.version??0)+1,createdAt:existing?.createdAt??now,updatedAt:now};data.orders=existing?data.orders.map(o=>o.id===id?next:o):[next,...data.orders];}
 else if(op==='setOrderStatus'){const o=data.orders.find(o=>o.id===id);check(o,p.version);o!.status=orderStatus(p.status);o!.version++;}
 else if(op==='createBooking'){const c=data.clients.find(c=>c.id===p.client);if(!c)fail('Cliente não encontrado.');check(data.company,p.companyVersion);const s=configuredSchedule(p,data.company.settings),visit=resolveVisit(data.company.mode,String(p.location),c!.address),active=data.company.settings.team.filter(member=>member.active),requested=String(p.professional||''),professional=active.length>1?active.find(member=>member.id===requested):active[0];if(active.length>1&&!professional)fail('Selecione um barbeiro.');if(professional&&!professionalAvailable(professional,data.company.settings,s.date,s.startMinute,s.duration))fail('O barbeiro não está disponível nesse horário.');if(data.bookings.some(b=>b.date===s.date&&(b.professional||'')===(professional?.id||'')&&b.status!=='Cancelado'&&Number(b.time.slice(0,2))*60+Number(b.time.slice(3))<s.startMinute+s.duration&&Number(b.time.slice(0,2))*60+Number(b.time.slice(3))+b.duration>s.startMinute))fail('Esse horário conflita com outro agendamento.');data.bookings.push({id,client:c!.id,date:s.date,time:s.time,duration:s.duration,kind:s.kind,amount:data.company.settings.services.find(service=>service.id===p.serviceId)?.price??0,paymentStatus:'Pendente',professional:professional?.id,...visit,status:'Pendente',version:1});}
 else if(op==='rescheduleBooking'){const b=data.bookings.find(b=>b.id===id);check(b,p.version);if(['Concluído','Cancelado'].includes(b!.status))fail('Este atendimento não pode ser reagendado.');const s=configuredSchedule(p,data.company.settings),professional=data.company.settings.team.find(member=>member.id===b!.professional);if(professional&&!professionalAvailable(professional,data.company.settings,s.date,s.startMinute,s.duration))fail('O barbeiro não está disponível nesse horário.');if(data.bookings.some(other=>other.id!==id&&other.date===s.date&&(other.professional||'')===(b!.professional||'')&&other.status!=='Cancelado'&&Number(other.time.slice(0,2))*60+Number(other.time.slice(3))<s.startMinute+s.duration&&Number(other.time.slice(0,2))*60+Number(other.time.slice(3))+other.duration>s.startMinute))fail('Esse horário conflita com outro agendamento.');b!.date=s.date;b!.time=s.time;b!.duration=s.duration;b!.version++;}
 else if(op==='saveClientPlan'){const service=data.company.settings.services.find(item=>item.id===p.serviceId&&item.pricingModel==='monthly');if(!service)fail('Selecione um plano mensal ativo.');const plan:ClientPlan={id,customerId:String(p.customerId),serviceId:service!.id,serviceName:service!.name,includedUses:Number(p.includedUses),usedUses:0,renewsOn:String(p.renewsOn),active:true,version:1,createdAt:now};data.plans.push(plan);}
 else if(op==='useClientPlan'){const plan=data.plans.find(item=>item.id===id);check(plan,p.version);if(plan!.usedUses>=plan!.includedUses)fail('Este plano não possui usos disponíveis.');plan!.usedUses++;plan!.version++;}
 else if(op==='renewClientPlan'){const plan=data.plans.find(item=>item.id===id);check(plan,p.version);plan!.usedUses=0;plan!.renewsOn=String(p.renewsOn);plan!.active=true;plan!.version++;}
 else if(op==='setBookingPayment'){const b=data.bookings.find(b=>b.id===id);check(b,p.version);b!.amount=Number(p.amount);b!.paymentStatus='Pago';b!.paymentMethod=String(p.method);b!.paidAt=now;b!.version++;}
 else if(op==='setBookingStatus'){const b=data.bookings.find(b=>b.id===id);check(b,p.version);const status=String(p.status);if(!(b!.status==='Pendente'&&['Confirmado','Cancelado'].includes(status)||b!.status==='Confirmado'&&['Concluído','Cancelado','Faltou'].includes(status)))fail('Alteração de status inválida.');b!.status=status;b!.version++;}
 else fail('Operação indisponível.');
 data.audit.unshift({id:data.audit.length+1,entity:'Demonstração',entityId:id,action:'Alteração temporária',createdAt:now});
 return Response.json({ok:true,id});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'Não foi possível concluir.'},{status:400});}
 },
 logo:()=>assets.get('logo')
 };
}
