'use client';
import type {SupabaseClient} from '@supabase/supabase-js';
import {createBrowserClient} from '@supabase/ssr';
let client:SupabaseClient|undefined;
export function authConfigured(){return !!process.env.NEXT_PUBLIC_SUPABASE_URL&&!!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;}
export function browserSupabase():SupabaseClient{if(!authConfigured())throw new Error('Configure o Supabase para ativar o acesso.');return client??=createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);}
