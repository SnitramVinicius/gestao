import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
const user=process.argv[2],apply=process.argv.includes('--apply');
if(!/^[0-9a-f-]{36}$/i.test(user??''))throw new Error('Informe o UUID do usuário de destino.');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY;
if(!url||!key)throw new Error('Configure .env.local antes de importar.');
const raw=JSON.parse(await readFile(new URL('../migration/private/sites-export.json',import.meta.url),'utf8'));
if(raw.companies.length!==1||['customers','orders','bookings','photos'].some(t=>raw[t]?.length))throw new Error('Este script só transfere a configuração de uma empresa sem registros operacionais. É necessário um plano de transferência para esse retrato.');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const target=await db.auth.admin.getUserById(user);if(target.error||!target.data.user)throw new Error('Usuário de destino não encontrado.');
const existing=await db.from('companies').select('id').eq('id',user).maybeSingle();if(existing.error)throw existing.error;if(existing.data)throw new Error('A empresa de destino já existe; o script não sobrescreve configurações.');
const source=raw.companies[0];if(source.logo_key)throw new Error('O logo precisa ser transferido antes.');
console.log('Destino verificado. Uma configuração de empresa será importada; nenhum registro será sobrescrito.');
if(!apply){console.log('Simulação concluída. Use --apply para executar.');process.exit(0);}
const result=await db.from('companies').insert({id:user,name:source.name,mode:source.mode,version:1,settings:typeof source.settings==='string'?JSON.parse(source.settings):source.settings??null});
if(result.error)throw result.error;console.log('Configuração importada.');
