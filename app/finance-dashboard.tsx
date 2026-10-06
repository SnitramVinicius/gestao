'use client';
import {useMemo,useState} from 'react';
import {BadgeDollarSign,CalendarDays,CreditCard,TrendingUp,UsersRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {NativeSelect} from '@/components/ui/native-select';
import type {Client} from '@/lib/customer-rules';
import type {Booking,Company} from '@/lib/workspace-model';

const methods=['Pix','Dinheiro','Cartão de débito','Cartão de crédito','Outro'];
const money=(value:number)=>value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export function FinanceDashboard({company,clients,bookings,disabled,onPayment}:{company:Company;clients:Client[];bookings:Booking[];disabled:boolean;onPayment:(booking:Booking,method:string,amount:number)=>Promise<void>}){
 const [method,setMethod]=useState<Record<string,string>>({}),[amount,setAmount]=useState<Record<string,string>>({});
 const now=new Date(),today=new Intl.DateTimeFormat('en-CA',{timeZone:company.settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(now),month=today.slice(0,7);
 const paid=bookings.filter(booking=>booking.paymentStatus==='Pago'),paidDate=(booking:Booking)=>booking.paidAt?new Intl.DateTimeFormat('en-CA',{timeZone:company.settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(booking.paidAt)):booking.date;
 const daily=paid.filter(booking=>paidDate(booking)===today).reduce((sum,booking)=>sum+booking.amount,0),monthly=paid.filter(booking=>paidDate(booking).startsWith(month)).reduce((sum,booking)=>sum+booking.amount,0);
 const pending=bookings.filter(booking=>booking.status!=='Cancelado'&&booking.paymentStatus!=='Pago'),pendingTotal=pending.reduce((sum,booking)=>sum+booking.amount,0);
 const commissions=useMemo(()=>company.settings.team.filter(member=>member.active||bookings.some(booking=>booking.professional===member.id)).map(member=>{const revenue=paid.filter(booking=>booking.professional===member.id&&paidDate(booking).startsWith(month)).reduce((sum,booking)=>sum+booking.amount,0);return {member,revenue,commission:revenue*(member.commission??0)/100};}),[company.settings.team,bookings,month]);
 const client=(id:string)=>clients.find(item=>item.id===id)?.name??'Cliente';
 return <section className="finance-panel"><div className="finance-metrics"><article><BadgeDollarSign/><div><small>Recebido hoje</small><strong>{money(daily)}</strong></div></article><article><TrendingUp/><div><small>Faturamento do mês</small><strong>{money(monthly)}</strong></div></article><article><CreditCard/><div><small>A receber</small><strong>{money(pendingTotal)}</strong></div></article><article><CalendarDays/><div><small>Pagamentos no mês</small><strong>{paid.filter(booking=>paidDate(booking).startsWith(month)).length}</strong></div></article></div>
 <section className="panel finance-section"><div className="section-title"><div><h2>Pagamentos pendentes</h2><p className="muted">Marque o atendimento como pago e escolha a forma de pagamento.</p></div></div>{pending.length===0?<p className="empty">Nenhum pagamento pendente.</p>:pending.sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).map(booking=><article className="payment-row" key={booking.id}><div><strong>{client(booking.client)}</strong><small>{booking.kind} · {new Date(booking.date+'T12:00:00').toLocaleDateString('pt-BR')} às {booking.time}</small></div><label>Valor<Input type="number" min={0} step="0.01" value={amount[booking.id]??String(booking.amount)} onChange={event=>setAmount(current=>({...current,[booking.id]:event.target.value}))}/></label><label>Forma<NativeSelect value={method[booking.id]??'Pix'} onChange={event=>setMethod(current=>({...current,[booking.id]:event.target.value}))}>{methods.map(item=><option key={item}>{item}</option>)}</NativeSelect></label><Button disabled={disabled} onClick={()=>void onPayment(booking,method[booking.id]??'Pix',Number(amount[booking.id]??booking.amount))}>Marcar como pago</Button></article>)}</section>
 <section className="panel finance-section"><div className="section-title"><div><h2>Comissões do mês</h2><p className="muted">Cálculo simples sobre os atendimentos pagos de cada barbeiro.</p></div></div>{commissions.length===0?<p className="empty">Cadastre barbeiros e percentuais de comissão.</p>:<div className="commission-list">{commissions.map(({member,revenue,commission})=><article key={member.id}><UsersRound/><div><strong>{member.name}</strong><small>{member.commission??0}% sobre {money(revenue)}</small></div><strong>{money(commission)}</strong></article>)}</div>}</section>
 <section className="panel finance-section"><div className="section-title"><div><h2>Recebimentos recentes</h2><p className="muted">Últimos atendimentos marcados como pagos.</p></div></div>{paid.slice().sort((a,b)=>(b.paidAt??'').localeCompare(a.paidAt??'')).slice(0,10).map(booking=><article className="paid-row" key={booking.id}><div><strong>{client(booking.client)}</strong><small>{booking.kind} · {booking.paymentMethod}</small></div><strong>{money(booking.amount)}</strong></article>)}{paid.length===0&&<p className="empty">Nenhum pagamento registrado.</p>}</section>
 </section>;
}


