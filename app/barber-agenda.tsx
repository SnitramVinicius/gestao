'use client';
import {useEffect,useMemo,useState} from 'react';
import {CalendarDays,Clock,Phone,Scissors,UserRound} from 'lucide-react';

type Item={id:string;date:string;time:string;duration:number;kind:string;status:string;customer:{name:string;phone:string}};
type Data={company:string;barber:{name:string;role:string};timezone:string;bookings:Item[]};
const dateLabel=(date:string)=>new Date(date+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'});
export function BarberAgenda({token}:{token:string}){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
 useEffect(()=>{fetch('/api/barber-agenda/'+encodeURIComponent(token),{cache:'no-store'}).then(async response=>{const body=await response.json();if(!response.ok)throw new Error(body.error||'Não foi possível abrir sua agenda.');setData(body);}).catch(reason=>setError(reason.message)).finally(()=>setLoading(false));},[token]);
 const groups=useMemo(()=>{const map=new Map<string,Item[]>();for(const item of data?.bookings??[])map.set(item.date,[...(map.get(item.date)??[]),item]);return [...map.entries()];},[data]);
 if(loading)return <main className="barber-agenda"><div className="barber-agenda-card"><p>Carregando sua agenda…</p></div></main>;
 if(error||!data)return <main className="barber-agenda"><div className="barber-agenda-card"><h1>Acesso indisponível</h1><p>{error}</p></div></main>;
 return <main className="barber-agenda"><div className="barber-agenda-card"><header><span><Scissors/></span><div><small>{data.company}</small><h1>Agenda de {data.barber.name}</h1><p>{data.barber.role} · somente seus atendimentos</p></div></header>
  <div className="barber-agenda-summary"><CalendarDays/><div><strong>{data.bookings.length}</strong><small>agendamentos nos próximos 60 dias</small></div></div>
  {groups.length===0?<div className="barber-agenda-empty"><CalendarDays/><h2>Nenhum horário agendado</h2><p>Quando um cliente escolher você, o atendimento aparecerá aqui.</p></div>:groups.map(([date,items])=><section key={date}><h2>{dateLabel(date)}</h2>{items.map(item=><article key={item.id}><div className="barber-time"><Clock/><strong>{item.time}</strong><small>{item.duration} min</small></div><div className="barber-client"><strong>{item.customer.name}</strong><span><Phone/>{item.customer.phone||'Telefone não informado'}</span><small>{item.kind}</small></div><span className={'barber-status status-'+item.status.toLowerCase()}>{item.status}</span></article>)}</section>)}
  <footer>Acesso privado · não compartilhe este link</footer>
 </div></main>;
}

