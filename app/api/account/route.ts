import {context,checked,failure,json,readJson,storageBucket} from '@/db/runtime';
import {AppError,mutationOrigin,object,text} from '@/lib/workspace-validation';

export const dynamic='force-dynamic';

export async function DELETE(request:Request){try{
 mutationOrigin(request);const input=object(await readJson(request));if(text(input.confirmation,30,true)!=='EXCLUIR MINHA CONTA')throw new AppError(400,'Digite EXCLUIR MINHA CONTA para confirmar.');
 const {tenant,db}=await context(request);const photos=checked(await db.from('photos').select('object_key').eq('tenant',tenant)),company=checked(await db.from('companies').select('logo_key').eq('id',tenant).maybeSingle());
 const keys=[...photos.map(item=>item.object_key),...(company?.logo_key?[company.logo_key]:[])];if(keys.length)await db.storage.from(storageBucket).remove(keys);
 checked(await db.rpc('delete_company_data',{p_tenant:tenant}));const {error}=await db.auth.admin.deleteUser(tenant);if(error)throw error;
 return json({ok:true});
 }catch(error){return failure(error)}}
