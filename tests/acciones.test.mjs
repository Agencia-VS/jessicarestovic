import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const entry='src/lib/acciones/exposiciones.ts';
const result=await build({entryPoints:[entry],bundle:true,platform:'node',format:'cjs',write:false,packages:'external',plugins:[{name:'fronteras-servidor',setup(b){
 b.onResolve({filter:/^(next\/cache|next\/navigation|@\/lib\/supabase\/server)$/},args=>({path:args.path,namespace:'prueba'}));
 b.onLoad({filter:/.*/,namespace:'prueba'},args=>({contents:args.path==='next/cache'?'export function revalidatePath() {}':args.path==='next/navigation'?'export function redirect() { throw new Error("REDIRECT"); }':'export async function createClient(){return globalThis.__dbPrueba}',loader:'js'}));
 if(process.env.TEST_PR31_BASELINE==='true')b.onLoad({filter:/lib\/acciones\/exposiciones\.ts$/},args=>({contents:execFileSync('git',['show','a6d8eefe9df1af2b53da7a617ae22cec55d519c6:'+entry],{encoding:'utf8'}),loader:'ts',resolveDir:args.path.slice(0,args.path.lastIndexOf('/'))}));
}}]});
const mod={exports:{}};new Function('require','module','exports',result.outputFiles[0].text)(createRequire(import.meta.url),mod,mod.exports);
const {editarExposicion,reordenarExposiciones,alternarExposicionPublicada}=mod.exports;
function db({rpcError=null,updateError=null}={}){
 const calls=[];const query={update(data){calls.push(data);return query;},eq(){return query;},select(){return query;},maybeSingle:async()=>({data:updateError?null:{id:'test'},error:updateError}),then(resolve){return Promise.resolve({error:updateError}).then(resolve);}};
 globalThis.__dbPrueba={auth:{getUser:async()=>({data:{user:{id:'test'}}})},from:()=>query,rpc:async()=>({error:rpcError})};return calls;
}
function form(){const f=new FormData();f.set('titulo','Prueba');f.set('publicada','on');return f;}
test('editar datos sin encuadre no envía columnas de la migración 0007',async()=>{
 const calls=db();await editarExposicion('id','trabajo',{},form());
 assert.equal(Object.hasOwn(calls[0],'portada_foco_x'),false);
 assert.equal(Object.hasOwn(calls[0],'portada_foco_y'),false);
});
test('el encuadre se guarda y se limita a 0–100 cuando existe en el formulario',async()=>{
 const calls=db(),f=form();f.set('portada_foco_x','130');f.set('portada_foco_y','-10');
 await editarExposicion('id','trabajo',{},f);assert.equal(calls[0].portada_foco_x,100);assert.equal(calls[0].portada_foco_y,0);
});
test('RPC ausente explica la migración pendiente sin indicar un falso éxito',async()=>{
 db({rpcError:{code:'PGRST202'}});const r=await reordenarExposiciones(['10000000-0000-4000-8000-000000000001'],'exposicion');
 assert.equal(r.estado,'error');assert.match(r.aviso,/0007_grilla_orden.sql/);
});
test('un error al publicar llega a la interfaz',async()=>{
 db({updateError:{code:'42501'}});const r=await alternarExposicionPublicada('id',false);assert.equal(r.estado,'error');
});
