import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {NativeSelect} from '@/components/ui/native-select';
import {type Client,type VisitLocation,formatAddress} from '@/lib/customer-rules';
import {type Company} from '@/lib/workspace-model';
import {businessDay} from '@/lib/company-settings';

export function BookingForm({company,clients,date,disabled,onSave}:{company:Company;clients:Client[];date:string;disabled:boolean;onSave:(payload:unknown)=>Promise<unknown>}){
 const services=company.settings.services.filter(service=>service.active),barbers=company.settings.team.filter(member=>member.active);
 const [client,setClient]=useState(''),[location,setLocation]=useState<VisitLocation>('customer'),[serviceId,setServiceId]=useState(services[0]?.id??''),[professional,setProfessional]=useState(barbers.length===1?barbers[0].id:'');
 const selected=services.find(service=>service.id===serviceId),day=businessDay(date,company.settings);
 return <form className="entry-form" onSubmit={async event=>{event.preventDefault();const form=new FormData(event.currentTarget);await onSave({client,date,time:String(form.get('time')),duration:selected?.duration??Number(form.get('duration')),serviceId,professional,location,companyVersion:company.version});}}><fieldset className="form-fieldset" disabled={disabled}>
  <label>Cliente<NativeSelect required value={client} onChange={event=>setClient(event.target.value)}><option value="" disabled>Selecione</option>{clients.map(customer=><option key={customer.id} value={customer.id}>{customer.name}</option>)}</NativeSelect></label>
  {barbers.length>1&&<label>Barbeiro<NativeSelect required value={professional} onChange={event=>setProfessional(event.target.value)}><option value="" disabled>Selecione o barbeiro</option>{barbers.map(barber=><option key={barber.id} value={barber.id}>{barber.name}</option>)}</NativeSelect></label>}
  {barbers.length===1&&<p className="booking-location">Barbeiro: {barbers[0].name}</p>}
  <label>Horário<Input name="time" type="time" required min={day?.open} max={day?.close} defaultValue={day?.open}/></label>
  {company.settings.services.length>0?<label>Serviço<NativeSelect required value={serviceId} onChange={event=>setServiceId(event.target.value)}><option value="" disabled>Selecione um serviço ativo</option>{services.map(service=><option key={service.id} value={service.id}>{service.name} · {service.duration} min</option>)}</NativeSelect></label>:<label>Duração em minutos<Input name="duration" type="number" min={5} max={480} required defaultValue={30}/></label>}
  {company.mode==='both'&&<label>Local<NativeSelect value={location} onChange={event=>setLocation(event.target.value as VisitLocation)}><option value="customer">No endereço do cliente</option><option value="business">No estabelecimento</option></NativeSelect></label>}
  <p className="booking-location">{company.mode==='customer'||(company.mode==='both'&&location==='customer')?'Endereço: '+formatAddress(clients.find(customer=>customer.id===client)?.address):'Atendimento na barbearia.'}</p>
  {!day?.enabled&&<p className="notice">A barbearia está fechada nesta data.</p>}{company.settings.services.length>0&&!services.length&&<p className="notice">Ative um serviço em Serviços e planos para agendar.</p>}
  <Button type="submit" disabled={!day?.enabled||(company.settings.services.length>0&&!services.length)||(barbers.length>1&&!professional)}>{disabled?'Salvando…':'Agendar'}</Button>
 </fieldset></form>;
}

