import {AuthForm} from '../auth-form';
import {Sparkles,ShieldCheck} from 'lucide-react';

export const metadata={title:'Criar conta | Órbita'};
export default function SignupPage(){return <main className="signup-page"><section className="signup-card"><a className="login-brand signup-brand" href="/"><span className="brand-mark"><Sparkles aria-hidden="true"/></span>órbita<span>.</span></a><div className="signup-icon"><ShieldCheck/></div><p className="login-eyebrow">CRIE SUA BARBEARIA</p><AuthForm initialMode="signup"/><p className="signup-note">Após criar a conta, enviaremos um link para confirmar seu e-mail.</p></section></main>}
