'use client';
import {AuthForm} from './auth-form';
import {Sparkles,ArrowRight,Eye,EyeOff,CalendarDays,Users,ClipboardList,LockKeyhole} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export function LoginScreen(){

 return <main className="login-layout">
  <section className="login-story" aria-label="Sobre a Órbita">
   <a className="login-brand" href="/"><span className="brand-mark"><Sparkles aria-hidden="true"/></span>órbita<span>.</span></a>
   <div className="login-story-content"><p className="login-eyebrow">MAIS TEMPO PARA O SEU NEGÓCIO</p><h1>Sua empresa.<br/>Tudo no lugar.</h1><p>Organize clientes, compromissos e atividades para acompanhar o dia a dia da sua empresa.</p>
   <ul className="login-benefits"><li><Users aria-hidden="true"/><div><strong>Relacionamento com clientes</strong><span>Informações organizadas para um atendimento melhor.</span></div></li><li><CalendarDays aria-hidden="true"/><div><strong>Sua agenda, organizada</strong><span>Compromissos e horários para planejar sua rotina.</span></div></li><li><ClipboardList aria-hidden="true"/><div><strong>Atividades sob controle</strong><span>Acompanhe o que está em andamento e os próximos passos.</span></div></li></ul></div>
   <p className="login-story-footer">Órbita · Gestão para o dia a dia</p>
  </section>
  <section className="login-access" aria-labelledby="login-title"><div className="login-card">
   <span className="login-lock"><LockKeyhole aria-hidden="true" size={22}/></span><p className="login-eyebrow">ACESSE SUA EMPRESA</p><AuthForm/>
  </div><p className="login-footer">Seu negócio, em movimento.</p></section>
 </main>;
}
