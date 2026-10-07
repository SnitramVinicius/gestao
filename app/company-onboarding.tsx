'use client';
import {useState} from 'react';
import {Check,Scissors,UserRound,UsersRound} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {AddressFields} from './customer-form';
import {hasAddress,readAddress} from '@/lib/customer-rules';
import {servicesFor,type CompanySettings} from '@/lib/company-settings';
import type {Company} from '@/lib/workspace-model';

export function CompanyOnboarding({company,disabled,onSave}:{company:Company;disabled:boolean;onSave:(payload:unknown)=>Promise<unknown>}){
 const [hasTeam,setHasTeam]=useState(false),[error,setError]=useState('');
 return <div className="onboarding-shell"><header className="onboarding-brand"><img src="/navalhy-logo.png" alt="NAVALHY"/><small>Configuração da barbearia</small></header><main className="onboarding-card">
  <section><div className="onboarding-progress"><span>CONFIGURAÇÃO INICIAL</span><div><i className="active"/></div></div><p className="eyebrow">BEM-VINDO À ÓRBITA</p><h1>Vamos cadastrar sua barbearia</h1><p className="onboarding-intro">Preencha os dados básicos para começar. Depois você poderá cadastrar serviços, barbeiros, clientes e horários.</p>
   <div className="sector-free-note"><Scissors/><div><strong>Feito para barbearias</strong><small>Agenda, clientes, serviços, planos mensais e equipe em um sistema simples.</small></div></div>
   <form id="onboarding-form" className="onboarding-form" onInvalid={()=>setError('Preencha os campos obrigatórios destacados para continuar.')} onSubmit={async event=>{event.preventDefault();setError('');const form=new FormData(event.currentTarget),address=readAddress(form),name=String(form.get('name')||''),slug=name.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);const settings:CompanySettings={...company.settings,sector:'Barbearia',phone:String(form.get('phone')||''),email:String(form.get('email')||''),address:hasAddress(address)?address:undefined,services:servicesFor('Barbearia'),modules:['agenda','customers','professionals','resources'],hasTeam,team:company.settings.team,onboardingComplete:true};const saved=await onSave({name,slug,mode:'business',version:company.version,settings});if(!saved)setError('Não foi possível concluir. Confira os campos obrigatórios.');}}>
    <div className="settings-grid"><label>Nome da barbearia<Input name="name" required maxLength={100} autoFocus placeholder="Ex.: Barbearia do João"/></label><label>Telefone com DDD<Input name="phone" type="tel" required maxLength={20} placeholder="(11) 99999-9999"/></label><label>E-mail <small>Opcional</small><Input name="email" type="email" maxLength={254} placeholder="contato@barbearia.com"/></label></div>
    <AddressFields title="Endereço da barbearia" required/>
    <div className="team-choice"><button type="button" className={!hasTeam?'selected':''} onClick={()=>setHasTeam(false)}><UserRound/><strong>Trabalho sozinho</strong><small>Somente eu realizo os atendimentos.</small></button><button type="button" className={hasTeam?'selected':''} onClick={()=>setHasTeam(true)}><UsersRound/><strong>Tenho barbeiros</strong><small>Quero cadastrar outros profissionais.</small></button></div>
    {error&&<p role="alert" className="notice error-notice">{error}</p>}<footer className="onboarding-actions"><span/><Button type="submit" disabled={disabled}>{disabled?'Criando barbearia…':'Concluir e começar'}<Check/></Button></footer>
   </form>
  </section>
 </main></div>;
}

