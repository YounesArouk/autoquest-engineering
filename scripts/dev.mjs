// Works with normal npm usage and preview supervisors that pass Vite-style flags.
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),args=process.argv.slice(2);
let host='0.0.0.0',port=process.env.PORT||'3000';
for(let i=0;i<args.length;i++){
  if(args[i]==='--host'||args[i]==='--hostname')host=args[++i];
  else if(args[i]==='--port'||args[i]==='-p')port=args[++i];
}
const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'dev','--webpack','--hostname',host,'--port',port],{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
