// Ejecutar después de npm run build. Backend de transporte simulado, sin credenciales reales.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
const habilitado=process.env.RUN_HTTP_TESTS==='true';
test('HTTP: consentimiento obligatorio, firmas, retiro, validación y contactos idempotentes', { skip:!habilitado, timeout:60000 }, async()=>{
 const llamadas=[];
 const preferencias=new Map(), eventos=new Map(), leads=new Map();
 const backend=http.createServer(async(req,res)=>{
  let text='';for await(const chunk of req) text+=chunk;
  const body=text ? JSON.parse(text) : {};
  const url=new URL(req.url,'http://localhost'); llamadas.push(req.method+' '+url.pathname);
  res.setHeader('Content-Type','application/json');
  const send=(value)=>res.end(JSON.stringify(value));
  if(url.pathname==='/rest/v1/rpc/permitir_ingreso') return send(true);
  if(url.pathname==='/rest/v1/preferencia_analitica'){
   if(req.method==='POST'){preferencias.set(body.id,body);return send(null);}
   const id=url.searchParams.get('id')?.slice(3);
   if(req.method==='PATCH'){const p=preferencias.get(id);if(p)Object.assign(p,body);return send(null);}
   return send(preferencias.get(id) ?? null);
  }
  if(url.pathname==='/rest/v1/evento_web'){if(!eventos.has(body.id))eventos.set(body.id,body);return send(null);}
  if(url.pathname==='/rest/v1/rpc/registrar_contacto'){if(leads.has(body.p_id))return send(false);leads.set(body.p_id,body);return send(true);}
  if(url.pathname==='/rest/v1/exposicion')return send(null);
  return send([]);
 });
 await new Promise(r=>backend.listen(0,'127.0.0.1',r));
 const backendPort=backend.address().port;
 const port=3197;
 const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${backendPort}`,SUPABASE_ANON_KEY:'sb_publishable_fake_test',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_fake_test_only',ENABLE_ANALYTICS_TEST:'true',VERCEL_ENV:'development',NODE_ENV:'production'},stdio:['ignore','pipe','pipe']});
 let output='';app.stdout.on('data',b=>output+=b);app.stderr.on('data',b=>output+=b);
 const base=`http://127.0.0.1:${port}`;
 let cookie='';
 async function post(path,body,opts={}){
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:base,Cookie:cookie,...opts.headers},body:JSON.stringify(body)});
  for(const c of r.headers.getSetCookie()){
   const first=c.split(';')[0],name=first.split('=')[0];
   cookie=cookie.split('; ').filter(x=>x && !x.startsWith(name+'=')).concat(first).join('; ');
  }
  return r;
 }
 const event=()=>({id:randomUUID(),evento:'pagina',ruta:'/',origen:'directo',dispositivo:'computador'});
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(new Error(output)),20000);
   const check=()=>{if(output.includes('Ready')){clearTimeout(timer);resolve();}else setTimeout(check,50);};check();
  });
  assert.equal((await post('/api/eventos',event())).status,204, JSON.stringify({llamadas,output}));assert.equal(eventos.size,0);
  assert.equal((await post('/api/preferencias',{aceptada:true},{headers:{Origin:'https://otro.test'}})).status,429);
  const accepted=await post('/api/preferencias',{aceptada:true});assert.equal(accepted.status,200);
  assert(accepted.headers.getSetCookie().some(c=>c.includes('HttpOnly') && c.includes('Secure')));
  const consentCookie=cookie;
  const e=event();assert.equal((await post('/api/eventos',e)).status,204);assert.equal(eventos.size,1);
  await post('/api/eventos',e);assert.equal(eventos.size,1);
  await post('/api/eventos',{...event(),ruta:'/contacto?email=persona@example.test'});assert.equal(eventos.size,1);
  const goodCookie=cookie;cookie='jr_preferencia=forjada';await post('/api/eventos',event());assert.equal(eventos.size,1);cookie=goodCookie;
  assert.equal((await post('/api/eventos',{...event(),evento:'contacto'})).status,400);
  assert.equal((await post('/api/eventos',{...event(),ruta:'x'.repeat(5000)})).status,400);
  await post('/api/preferencias',{aceptada:false});await post('/api/eventos',event());assert.equal(eventos.size,1);
  await post('/api/eventos',event(),{headers:{Cookie:consentCookie}});assert.equal(eventos.size,1,'cookie antigua revocada en DB');
  const lead={id:randomUUID(),nombre:'Prueba',email:'prueba@example.test',motivo:'obra',grupo:null,guardar:true,novedades:false,empresa:''};
  assert.equal((await post('/api/contactos',{...lead,guardar:false})).status,400);
  assert.equal((await post('/api/contactos',lead)).status,200);assert.equal(leads.size,1);assert.equal(eventos.size,1);
  assert.equal((await post('/api/contactos',lead)).status,200);assert.equal(leads.size,1);
  assert.equal((await post('/api/contactos',{...lead,id:randomUUID(),empresa:'bot'})).status,400);
  assert.equal((await fetch(base+'/api/mantenimiento')).status,401);
 }finally{app.kill('SIGTERM');backend.closeAllConnections();await new Promise(r=>backend.close(r));}
});
