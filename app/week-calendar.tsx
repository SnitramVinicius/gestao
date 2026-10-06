'use client';
import {useMemo,useRef,useState} from 'react';
import {ChevronLeft,ChevronRight,GripVertical,MapPin,MessageCircle,Bell,CalendarDays} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {NativeSelect} from '@/components/ui/native-select';
import type {Booking,Company} from '@/lib/workspace-model';
import type {Client} from '@/lib/customer-rules';
import {businessDay,minute,professionalHours} from '@/lib/company-settings';
import {openWhatsApp} from '@/lib/whatsapp';

const SLOT=15,ROW=34;
function iso(d:Date){return d.toISOString().slice(0,10)}
function add(date:string,days:number){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return iso(d)}
function monday(date:string){const d=new Date(date+'T12:00:00Z'),day=d.getUTCDay();return add(date,-(day===0?6:day-1))}
function timeLabel(value:number){return String(Math.floor(value/60)).padStart(2,'0')+':'+String(value%60).padStart(2,'0')}
function title(date:string){return new Intl.DateTimeFormat('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(date+'T12:00:00Z')).replace('.','').toUpperCase()}
function monthRange(days:string[]){const fmt=new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'});return fmt.format(new Date(days[0]+'T12:00:00Z'))+' — '+fmt.format(new Date(days[days.length-1]+'T12:00:00Z'))}
const colors=['coral','blue','green','violet','rose'];
export function WeekCalendar({company,clients,bookings,selectedDate,saving,onSelectDate,onMove,onStatus}:{company:Company;clients:Client[];bookings:Booking[];selectedDate:string;saving:boolean;onSelectDate:(date:string)=>void;onMove:(booking:Booking,date:string,time:string)=>Promise<boolean>;onStatus:(booking:Booking,status:string)=>void}){
 const team=company.settings.team.filter(member=>member.active),[view,setView]=useState<'week'|'day'>('week'),[filter,setFilter]=useState('all');
 const days=useMemo(()=>view==='day'?[selectedDate]:Array.from({length:7},(_,i)=>add(monday(selectedDate),i)),[selectedDate,view]);
 const limits=days.map(d=>businessDay(d,company.settings)).filter(Boolean),openDays=limits.filter(d=>d.enabled),starts=openDays.map(d=>minute(d.open)),ends=openDays.map(d=>minute(d.close));const start=Math.min(...starts,8*60),end=Math.max(...ends,18*60),slots=Math.ceil((end-start)/SLOT);
 const [drag,setDrag]=useState<{booking:Booking;x:number;y:number}|null>(null),[chosen,setChosen]=useState<Booking|null>(null);const hold=useRef<ReturnType<typeof setTimeout>|null>(null);const moved=useRef(false);
 const customer=(id:string)=>clients.find(c=>c.id===id),name=(id:string)=>customer(id)?.name??'Cliente',barber=(id?:string)=>company.settings.team.find(member=>member.id===id)?.name;
 function notify(b:Booking,kind:'confirmation'|'reminder'){const client=customer(b.client);if(!client?.phone)return;openWhatsApp({customer:client.name,phone:client.phone,service:b.kind,barber:barber(b.professional),date:b.date,time:b.time,company:company.name},kind);}
 function target(x:number,y:number){const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-calendar-day]');if(!el)return null;const rect=el.getBoundingClientRect(),raw=Math.max(0,Math.min(slots-1,Math.floor((y-rect.top)/ROW)));return {date:el.dataset.calendarDay!,time:timeLabel(start+raw*SLOT)};}
 function begin(b:Booking,x:number,y:number){if(saving||['Concluído','Cancelado'].includes(b.status))return;moved.current=false;setDrag({booking:b,x,y});}
 async function finish(x:number,y:number){if(!drag)return;const t=target(x,y),b=drag.booking;setDrag(null);if(t&&(t.date!==b.date||t.time!==b.time)){moved.current=true;await onMove(b,t.date,t.time);}}
 function pointerDown(e:React.PointerEvent,b:Booking){if(e.pointerType==='touch'){hold.current=setTimeout(()=>{begin(b,e.clientX,e.clientY);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)},350)}else{begin(b,e.clientX,e.clientY);(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)}}
 function pointerMove(e:React.PointerEvent){if(drag){e.preventDefault();setDrag(d=>d?{...d,x:e.clientX,y:e.clientY}:d)}}
 function pointerUp(e:React.PointerEvent){if(hold.current)clearTimeout(hold.current);hold.current=null;if(drag)void finish(e.clientX,e.clientY)}
 return <div className="week-calendar">
  <div className="calendar-toolbar"><div className="calendar-view"><Button variant={view==='week'?'default':'outline'} onClick={()=>setView('week')}>Semana</Button><Button variant={view==='day'?'default':'outline'} onClick={()=>setView('day')}><CalendarDays/>Dia</Button></div><label className="barber-filter">Barbeiro<NativeSelect value={filter} onChange={event=>setFilter(event.target.value)}><option value="all">Todos</option>{team.map(member=><option key={member.id} value={member.id}>{member.name}</option>)}</NativeSelect></label><div className="calendar-nav"><Button variant="outline" aria-label="Semana anterior" onClick={()=>onSelectDate(add(selectedDate,view==='day'?-1:-7))}><ChevronLeft/></Button><Button variant="outline" onClick={()=>onSelectDate(iso(new Date()))}>Hoje</Button><Button variant="outline" aria-label="Próxima semana" onClick={()=>onSelectDate(add(selectedDate,view==='day'?1:7))}><ChevronRight/></Button></div><strong>{monthRange(days)}</strong><span className="drag-hint"><GripVertical/> Arraste para reagendar</span></div>
  <div className={'calendar-scroll '+(drag?'is-dragging':'')}>
   <div className="calendar-grid" style={{'--calendar-slots':slots,gridTemplateColumns:'58px repeat('+days.length+', minmax('+(view==='day'?'520px':'150px')+', 1fr))'} as React.CSSProperties}>
    <div className="calendar-corner"/>{days.map(d=><button key={d} className={'calendar-day-head '+(d===selectedDate?'selected':'')+(d===iso(new Date())?' today':'')} onClick={()=>onSelectDate(d)}>{title(d)}</button>)}
    <div className="calendar-times" style={{height:slots*ROW}}>{Array.from({length:slots},(_,i)=>i%2===0&&<span key={i} style={{top:i*ROW}}>{timeLabel(start+i*SLOT)}</span>)}</div>
    {days.map(day=>{const selectedBarber=team.find(member=>member.id===filter),hours=selectedBarber?professionalHours(selectedBarber,company.settings)[new Date(day+'T12:00:00Z').getUTCDay()]:businessDay(day,company.settings);return <div key={day} data-calendar-day={day} className={'calendar-day '+(!hours?.enabled?'closed':'')} style={{height:slots*ROW}}>{!hours?.enabled&&<span className="closed-label">Folga</span>}{selectedBarber&&(selectedBarber.blocks??[]).filter(block=>block.date===day).map(block=><div className="calendar-block" key={block.id} style={{top:(minute(block.start)-start)/SLOT*ROW,height:Math.max(ROW,(minute(block.end)-minute(block.start))/SLOT*ROW)}}><strong>{block.reason}</strong><small>{block.start}–{block.end}</small></div>)}{bookings.filter(b=>b.date===day&&b.status!=='Cancelado'&&(filter==='all'||b.professional===filter)).map((b,index)=>{const top=(minute(b.time)-start)/SLOT*ROW,height=Math.max(ROW,b.duration/SLOT*ROW),barberIndex=Math.max(0,team.findIndex(member=>member.id===b.professional)),columns=filter==='all'&&team.length?team.length:1,eventStyle={top,height,left:'calc('+(barberIndex/columns*100)+'% + 3px)',right:'calc('+((columns-barberIndex-1)/columns*100)+'% + 3px)'};return <button type="button" aria-label={`${b.time}, ${name(b.client)}, ${b.kind}. Arraste para reagendar.`} key={b.id} className={'calendar-event event-'+colors[(team.length?barberIndex:index)%colors.length]+' '+(drag?.booking.id===b.id?'drag-source':'')} style={eventStyle} onPointerDown={e=>pointerDown(e,b)} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp} onClick={()=>{if(!moved.current)setChosen(b)}}><GripVertical className="event-grip"/><strong>{b.time} · {name(b.client)}</strong><small>{b.kind}{barber(b.professional)?' · '+barber(b.professional):''}</small>{b.location==='customer'&&<MapPin className="event-location"/>}</button>})}</div>})}
   </div>
  </div>
  {drag&&<div className="drag-preview" style={{left:drag.x,top:drag.y}}><strong>{name(drag.booking.client)}</strong><small>{drag.booking.kind} · {drag.booking.duration} min{barber(drag.booking.professional)?' · '+barber(drag.booking.professional):''}</small></div>}
  {chosen&&<div className="calendar-selection"><div><strong>{name(chosen.client)}</strong><small>{chosen.time} · {chosen.kind}{barber(chosen.professional)?' · '+barber(chosen.professional):''}</small></div>{chosen.status==='Pendente'&&<><Button disabled={saving} onClick={()=>{onStatus(chosen,'Confirmado');notify(chosen,'confirmation');setChosen(null);}}><MessageCircle/>Confirmar e avisar</Button><Button variant="outline" disabled={saving} onClick={()=>{onStatus(chosen,'Cancelado');setChosen(null);}}>Recusar</Button></>}{chosen.status==='Confirmado'&&<><Button variant="outline" disabled={saving} onClick={()=>notify(chosen,'reminder')}><Bell/>Enviar lembrete</Button><Button disabled={saving} onClick={()=>{onStatus(chosen,'Concluído');setChosen(null);}}>Concluir</Button><Button variant="outline" disabled={saving} onClick={()=>{onStatus(chosen,'Cancelado');setChosen(null);}}>Cancelar</Button></>}<Button variant="ghost" onClick={()=>setChosen(null)}>Fechar</Button></div>}
  <p className="calendar-help">No celular, toque e segure um atendimento antes de arrastar. Toque em um atendimento pendente para confirmá-lo.</p>
 </div>
}







