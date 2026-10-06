import {context,checked,json,failure,readJson} from '@/db/runtime';
import {storedSettings} from '@/lib/company-settings';
import {AppError,mutationOrigin,object,text} from '@/lib/workspace-validation';

const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
export async function POST(request:Request){try{
 mutationOrigin(request);const payload=object(await readJson(request)),professionalId=text(payload.professionalId,80,true),{db,tenant}=await context(request);
 const company=checked(await db.from('companies').select('settings').eq('id',tenant).single()),settings=storedSettings(company.settings),barber=settings.team.find(member=>member.id===professionalId&&member.active);
 if(!barber)throw new AppError(404,'Salve o barbeiro ativo antes de gerar o acesso.');
 const token=Array.from(crypto.getRandomValues(new Uint8Array(24))).map(byte=>byte.toString(16).padStart(2,'0')).join('');
 checked(await db.from('barber_access').upsert({id:crypto.randomUUID(),tenant,professional_id:professionalId,token_hash:await hash(token),created_at:new Date().toISOString()},{onConflict:'tenant,professional_id'}));
 return json({ok:true,token});
 }catch(error){return failure(error);}}

