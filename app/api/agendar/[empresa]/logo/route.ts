import {adminClient,checked,failure,fileResponse,storageBucket} from '@/db/runtime';
import {AppError} from '@/lib/workspace-validation';

export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{empresa:string}>}){try{const empresa=(await params).empresa.toLowerCase(),db=adminClient(),uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(empresa),query=db.from('companies').select('logo_key').eq(uuid?'id':'slug',empresa),company=checked(await query.maybeSingle());if(!company?.logo_key)throw new AppError(404,'Logo não encontrado.');return fileResponse(checked(await db.storage.from(storageBucket).download(company.logo_key)))}catch(error){return failure(error)}}
