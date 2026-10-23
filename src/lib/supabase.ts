import {createClient,type SupabaseClient} from '@supabase/supabase-js';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const cloudConfigured=Boolean(url&&key);
let client:SupabaseClient|null=null;
export function supabase() {
  if(!cloudConfigured)return null;
  if(!client)client=createClient(url!,key!,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
}
