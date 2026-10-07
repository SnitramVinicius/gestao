'use client';
import {AuthForm} from './auth-form';
import {ArrowRight,CalendarDays,Users,Scissors,LockKeyhole} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export function LoginScreen(){

 return <main className="login-layout">
  <section className="login-story" aria-label="Sobre a NAVALHY">
   <a className="login-brand navalhy-brand-light" href="/"><img src="/navalhy-logo.png" alt="NAVALHY"/></a>
   <div className="login-story-content"><p className="login-eyebrow">MAIS TEMPO PARA SUA BARBEARIA</p><h1>Sua barbearia.<br/>Tudo no lugar.</h1><p>Organize clientes, horários, serviços e barbeiros em um só lugar.</p>
   <ul className="login-benefits"><li><Users aria-hidden="true"/><div><strong>Seus clientes por perto</strong><span>Contatos e histórico sempre organizados.</span></div></li><li><CalendarDays aria-hidden="true"/><div><strong>Agenda sem confusão</strong><span>Cortes e horários organizados para toda a equipe.</span></div></li><li><Scissors aria-hidden="true"/><div><strong>Serviços e planos</strong><span>Cadastre cortes, barba, combos e planos mensais.</span></div></li></ul></div>
   <p className="login-story-footer">NAVALHY · Gestão simples para barbearias</p>
  </section>
  <section className="login-access" aria-labelledby="login-title"><div className="login-card">
   <span className="login-lock"><LockKeyhole aria-hidden="true" size={22}/></span><p className="login-eyebrow">ACESSE SUA BARBEARIA</p><a className="demo-entry" href="/demonstracao">Entrar sem login<ArrowRight size={18} aria-hidden="true"/></a><p className="demo-entry-note">Acesso de demonstração. As alterações são temporárias e somem ao recarregar.</p><AuthForm/>
  </div><p className="login-footer">Sua barbearia, em movimento.</p></section>
 </main>;
}

