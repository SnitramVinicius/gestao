'use client';
import {useMemo,useState} from 'react';
import {CalendarCheck,Clock3,Scissors,Star,UserRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {NativeSelect} from '@/components/ui/native-select';
import type {Client} from '@/lib/customer-rules';
import type {Booking,Company} from '@/lib/workspace-model';

export function CustomerHistory({client,company,bookings,disabled,onSave}:{client:Client;company:Company;bookings:Booking[];disabled:boolean;onSave:(preferredProfessional:string,notes:string)=>Promise<boolean>}){
 const [preferred,setPreferred]=useState(client.preferredProfessional??''),[notes,setNotes]=useState(client.notes??''),[saving,setSaving]=useState(false);
 const visits=useMemo(()=>bookings.filter(booking=>booking.client===client.id&&booking.status==='Concluído').sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)),[bookings,client.id]);
 const inferred=useMemo(()=>{const counts=new Map<string,number>();for(const visit of visits)if(visit.professional)counts.set(visit.professional,(counts.get(visit.professional)??0)+1);return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]??'';},[visits]);
 const barber=(id?:string)=>company.settings.team.find(member=>member.id===id)?.name??'Não informado',favorite=preferred||inferred;
 return <section className="customer-history"><div className="customer-history-metrics"><article><CalendarCheck/><div><strong>{visits.length}</strong><small>visitas concluídas</small></div></article><article><Clock3/><div><strong>{visits[0]?new Date(visits[0].date+'T12:00:00').toLocaleDateString('pt-BR'):'—'}</strong><small>última visita</small></div></article><article><Star/><div><strong>{favorite?barber(favorite):'—'}</strong><small>barbeiro preferido</small></div></article></div>
 <div className="customer-profile-form"><label>Barbeiro preferido<NativeSelect value={preferred} onChange={event=>setPreferred(event.target.value)}><option value="">Calcular pelo histórico</option>{company.settings.team.filter(member=>member.active).map(member=><option value={member.id} key={member.id}>{member.name}</option>)}</NativeSelect></label><label>Observações do cliente<textarea value={notes} maxLength={2000} placeholder="Ex.: corte degradê baixo, máquina 1 nas laterais, acabamento quadrado…" onChange={event=>setNotes(event.target.value)}/></label><Button disabled={disabled||saving} onClick={async()=>{setSaving(true);try{await onSave(preferred,notes);}finally{setSaving(false);}}}>{saving?'Salvando…':'Salvar preferências'}</Button></div>
 <div className="visit-history"><h3>Últimos cortes e serviços</h3>{visits.length===0?<div className="history-empty"><Scissors/><p>Nenhum atendimento concluído para este cliente.</p></div>:visits.slice(0,10).map(visit=><article key={visit.id}><span><Scissors/></span><div><strong>{visit.kind}</strong><small>{barber(visit.professional)}</small></div><div><strong>{new Date(visit.date+'T12:00:00').toLocaleDateString('pt-BR')}</strong><small>{visit.time} · {visit.duration} min</small></div></article>)}</div>
 </section>;
}

