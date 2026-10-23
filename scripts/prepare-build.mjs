import fs from 'node:fs';
import path from 'node:path';
try { if(fs.existsSync('.env.local')) process.loadEnvFile('.env.local'); } catch { throw new Error('Cannot parse .env.local'); }
const cloud=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
for (const name of ['demo-solutions.json','demo-exam-solutions.json']) {
const target=path.resolve('public/data/'+name);
if(cloud) {
  fs.rmSync(target,{force:true});
  console.log('Cloud build: demo correction file excluded from public assets.');
} else {
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.copyFileSync('data-source/'+name,target);
  console.log('Demo build: local practice enabled.');
}

}
