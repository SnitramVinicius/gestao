import {NextResponse} from 'next/server';
import {sessionClient} from '@/db/runtime';
export async function GET(req:Request){const url=new URL(req.url),code=url.searchParams.get('code');if(code){const client=await sessionClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(url.searchParams.get('recovery')==='1'?'/redefinir-senha':'/',url.origin));}return NextResponse.redirect(new URL('/login?auth_error=1',url.origin));}
