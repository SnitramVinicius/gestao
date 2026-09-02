'use client';
import {useState} from 'react';
import {Sparkles,ArrowRight,Eye,EyeOff,CalendarDays,Users,ClipboardList,LockKeyhole} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';

export function LoginScreen(){
 const [visible,setVisible]=useState(false);
 return <main className="login-layout">
  <section className="login-story" aria-label="Sobre a Órbita">
   <a className="login-brand" href="/"><span className="brand-mark"><Sparkles aria-hidden="true"/></span>órbita<span>.</span></a>
   <div className="login-story-content"><p className="login-eyebrow">MAIS TEMPO PARA O SEU NEGÓCIO</p><h1>Sua empresa.<br/>Tudo no lugar.</h1><p>Organize clientes, compromissos e atividades para acompanhar o dia a dia da sua empresa.</p>
   <ul className="login-benefits"><li><Users aria-hidden="true"/><div><strong>Relacionamento com clientes</strong><span>Informações organizadas para um atendimento melhor.</span></div></li><li><CalendarDays aria-hidden="true"/><div><strong>Sua agenda, organizada</strong><span>Compromissos e horários para planejar sua rotina.</span></div></li><li><ClipboardList aria-hidden="true"/><div><strong>Atividades sob controle</strong><span>Acompanhe o que está em andamento e os próximos passos.</span></div></li></ul></div>
   <p className="login-story-footer">Órbita · Gestão para o dia a dia</p>
  </section>
  <section className="login-access" aria-labelledby="login-title"><div className="login-card">
   <span className="login-lock"><LockKeyhole aria-hidden="true" size={22}/></span><p className="login-eyebrow">ACESSE SUA EMPRESA</p><h2 id="login-title">Bom ter você aqui.</h2><p className="login-subtitle">Entre para acompanhar seu negócio.</p>
   <div className="login-setup" id="login-setup"><strong>Acesso por e-mail em preparação</strong><p>O cadastro de conta e a recuperação de senha ainda não estão disponíveis. Neste piloto, use o acesso com ChatGPT abaixo.</p></div>
   <div className="login-fields" aria-describedby="login-setup">
    <label htmlFor="login-email">E-mail<Input id="login-email" type="email" placeholder="voce@empresa.com.br" autoComplete="username" disabled/></label>
    <label htmlFor="login-password">Senha<span className="login-password"><Input id="login-password" type={visible?'text':'password'} placeholder="Sua senha" autoComplete="current-password" disabled/><Button type="button" variant="ghost" size="icon" aria-label={visible?'Ocultar senha':'Mostrar senha'} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff/>:<Eye/>}</Button></span></label>
    <Button disabled className="login-submit">Entrar com e-mail<ArrowRight aria-hidden="true"/></Button>
   </div>
   <div className="login-divider"><span>ACESSO DISPONÍVEL NO PILOTO</span></div>
   <a className="login-current" href="/signin-with-chatgpt?return_to=%2F" target="_top">Entrar com ChatGPT<ArrowRight aria-hidden="true" size={17}/></a>
   <p className="login-local-note">Ao executar no localhost, esse acesso usa a conta de teste local.</p>
  </div><p className="login-footer">Seu negócio, em movimento.</p></section>
 </main>;
}
