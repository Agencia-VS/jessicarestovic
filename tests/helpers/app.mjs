// App real + transporte Supabase simulado. No usa credenciales ni datos de producción.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';

export async function levantarApp({dev=false}={}) {
  const uid='00000000-0000-4000-8000-000000000001';
  const grupos=Array.from({length:9},(_,i)=>({id:`10000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`, titulo:i<6?`Expo ${i+1}`:`Trabajo ${i-5}`,slug:i<6?`expo-${i+1}`:`trabajo-${i-5}`,tipo:i<6?'exposicion':'trabajo',orden:i+1,publicada:true,lugar:null,anio:null,descripcion:null,creado_en:'2026-10-01T12:00:00Z',actualizado_en:'2026-10-01T12:00:00Z',portada_foco_x:50,portada_foco_y:50,fotos:[]}));
  const estado={grupos,obras:[],fotosSala:[],storage:new Set(),preferencias:new Map(),eventos:new Map(),leads:new Map(),consentimientos:[],llamadas:[],falloOrden:false,sinMigracion:false,falloPublicar:false,demoraOrden:0,demoraEvento:0};
  function usuario(token){try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url'));}catch{return {};}}
  const backend=http.createServer(async(req,res)=>{
    let raw='';for await(const chunk of req)raw+=chunk;
    const body=raw&&req.headers['content-type']?.includes('application/json')?JSON.parse(raw):{};
    const url=new URL(req.url,'http://localhost');
    estado.llamadas.push({method:req.method,path:url.pathname,body});
    const claims=usuario(req.headers.authorization?.replace('Bearer ','')??'');
    res.setHeader('Content-Type','application/json');
    res.setHeader('Access-Control-Allow-Origin','*');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','authorization, apikey, content-type, x-upsert, x-client-info');
    if(req.method==='OPTIONS'){res.statusCode=204;return res.end();}
    const send=(data,status=200)=>{res.statusCode=status;res.end(JSON.stringify(data));};
    const object=(rows)=>req.headers.accept?.includes('object+json')?rows[0]??null:rows;
    const match=(row)=>[...url.searchParams].every(([k,v])=>!v.startsWith('eq.')||String(row[k])===v.slice(3));
    if(url.pathname.startsWith('/storage/v1/object/upload/sign/')){
      const path=url.pathname.slice('/storage/v1/object/upload/sign/'.length);
      const [bucket,...rest]=path.split('/');const archivo=`${bucket}/${rest.join('/')}`;
      if(req.method==='POST')return send({url:`/object/upload/sign/${archivo}?token=test-token`});
      if(req.method==='PUT'){estado.storage.add(archivo);return send({Key:archivo});}
    }
    if(url.pathname.startsWith('/storage/v1/object/info/')){
      const archivo=url.pathname.slice('/storage/v1/object/info/'.length);
      return estado.storage.has(archivo)?send({name:archivo.split('/').at(-1),metadata:{}}):send({message:'Object not found'},404);
    }
    if(url.pathname.startsWith('/storage/v1/object/')){
      const archivo=url.pathname.slice('/storage/v1/object/'.length);
      if(req.method==='DELETE'){estado.storage.delete(archivo);return send({});}
    }
    if(url.pathname==='/auth/v1/user')return claims.sub?send({id:claims.sub,email:'prueba@example.invalid',role:'authenticated',aud:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()}):send({message:'No session'},401);
    if(url.pathname==='/rest/v1/rpc/permitir_ingreso')return send(true);
    if(url.pathname==='/rest/v1/rpc/es_admin_comercial')return send(claims.sub===uid);
    if(url.pathname==='/rest/v1/rpc/reordenar_grupos'){
      if(estado.demoraOrden)await new Promise(r=>setTimeout(r,estado.demoraOrden));
      if(estado.sinMigracion)return send({code:'PGRST202',message:'Missing function'},404);
      if(estado.falloOrden)return send({code:'P0001',message:'Prueba de fallo'},400);
      for(const [i,id]of body.p_ids.entries()){const g=grupos.find(g=>g.id===id&&g.tipo===body.p_tipo);if(g)g.orden=i+1;}
      return send(null);
    }
    if(url.pathname==='/rest/v1/exposicion'){
      let rows=grupos.filter(match);
      if(req.method==='PATCH'){
        if(estado.sinMigracion && ('portada_foco_x' in body || 'portada_foco_y' in body))return send({code:'PGRST204',message:'Missing crop columns'},400);
        if(estado.falloPublicar)return send({code:'42501',message:'Denied'},403);
        for(const g of rows)Object.assign(g,body);
      }
      rows=[...rows].sort((a,b)=>a.orden-b.orden);
      return send(object(rows.map(g=>{const copy={...g,fotos:estado.fotosSala.filter(f=>f.exposicion_id===g.id)};if(estado.sinMigracion){delete copy.portada_foco_x;delete copy.portada_foco_y;}return copy;})));
    }
    if(url.pathname==='/rest/v1/obra'){
      let rows=estado.obras.filter(match);
      if(req.method==='POST'){
        const entradas=Array.isArray(body)?body:[body];
        for(const entrada of entradas)estado.obras.push({...entrada,id:randomUUID(),exposicion:grupos.find(g=>g.id===entrada.exposicion_id)??null,creado_en:new Date().toISOString(),actualizado_en:new Date().toISOString()});
        return send(null);
      }
      if(req.method==='PATCH')for(const obra of rows)Object.assign(obra,body);
      rows=[...rows].sort((a,b)=>a.orden-b.orden);
      return send(object(rows));
    }
    if(url.pathname==='/rest/v1/exposicion_foto'){
      let rows=estado.fotosSala.filter(match);
      if(req.method==='POST'){
        const entradas=Array.isArray(body)?body:[body];
        for(const entrada of entradas)estado.fotosSala.push({...entrada,id:randomUUID(),creado_en:new Date().toISOString()});
        return send(null);
      }
      if(req.method==='PATCH')for(const foto of rows)Object.assign(foto,body);
      if(req.method==='DELETE')estado.fotosSala=estado.fotosSala.filter(f=>!rows.includes(f));
      if(req.method==='HEAD'){res.setHeader('content-range',`0-0/${rows.length}`);return send(null);}
      return send(object(rows));
    }
    if(url.pathname==='/rest/v1/pagina')return send(null);
    if(url.pathname==='/rest/v1/preferencia_analitica'){
      if(req.method==='POST'){estado.preferencias.set(body.id,body);return send(null);}
      const id=url.searchParams.get('id')?.slice(3);
      if(req.method==='PATCH'){Object.assign(estado.preferencias.get(id)??{},body);return send(null);}
      return send(estado.preferencias.get(id)??null);
    }
    if(url.pathname==='/rest/v1/evento_web'){
      if(estado.demoraEvento)await new Promise(r=>setTimeout(r,estado.demoraEvento));
      if(!estado.eventos.has(body.id))estado.eventos.set(body.id,body);
      return send(null);
    }
    if(url.pathname==='/rest/v1/rpc/registrar_contacto'){
      if(estado.leads.has(body.p_id))return send(false);
      estado.leads.set(body.p_id,{id:body.p_id,nombre:body.p_nombre,email:body.p_email,motivo:body.p_motivo,grupo_id:body.p_grupo,novedades:body.p_novedades,baja_hash:body.p_baja_hash,estado:'nuevo',creado_en:new Date().toISOString(),actualizado_en:new Date().toISOString()});
      for(const finalidad of ['guardar_contacto','novedades_email'])estado.consentimientos.push({id:randomUUID(),contacto_id:body.p_id,finalidad,otorgado:finalidad==='guardar_contacto'||body.p_novedades,version:body.p_version,creado_en:new Date().toISOString()});
      return send(true);
    }
    if(url.pathname==='/rest/v1/contacto_lead'){
      if(claims.sub!==uid)return send({message:'Forbidden'},403);
      const rows=[...estado.leads.values()].filter(match);
      if(req.method==='PATCH')for(const row of rows)Object.assign(row,body);
      if(req.method==='DELETE')for(const row of rows)estado.leads.delete(row.id);
      res.setHeader('content-range',`0-${Math.max(0,rows.length-1)}/${rows.length}`);
      return send(object(rows));
    }
    if(url.pathname==='/rest/v1/consentimiento_contacto')return send(estado.consentimientos);
    if(url.pathname==='/rest/v1/rpc/retirar_novedades'){
      const lead=[...estado.leads.values()].find(l=>l.baja_hash===body.p_hash);
      if(lead)for(const l of estado.leads.values())if(l.email===lead.email)l.novedades=false;
      return send(null);
    }
    if(url.pathname==='/rest/v1/rpc/resumen_comercial'){
      const eventos=[...estado.eventos.values()];
      const count=e=>eventos.filter(x=>x.evento===e).length;
      return send({periodos:[{periodo:'actual',vistas:count('pagina'),sesiones:new Set(eventos.map(e=>e.sesion_id)).size,conversiones:new Set(eventos.filter(e=>e.evento!=='pagina').map(e=>e.sesion_id)).size,whatsapp:count('whatsapp'),email:count('email'),instagram:count('instagram')}],dias:[],paginas:[],fuentes:[],dispositivos:[],contactos:estado.leads.size,contactos_anteriores:0});
    }
    return send([]);
  });
  backend.listen(0,'127.0.0.1');await once(backend,'listening');
  const backendPort=backend.address().port;
  const port=Number(process.env.TEST_APP_PORT??3198);
  const base=`http://127.0.0.1:${port}`;
  const app=spawn(process.execPath,['node_modules/next/dist/bin/next',dev?'dev':'start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,SUPABASE_URL:`http://127.0.0.1:${backendPort}`,SUPABASE_ANON_KEY:'sb_publishable_fake',SUPABASE_SERVICE_ROLE_KEY:'sb_secret_fake_test_only',ENABLE_ANALYTICS_TEST:'true',VERCEL_ENV:'development',NODE_ENV:dev?'development':'production'},stdio:['ignore','pipe','pipe']});
  let output='';app.stdout.on('data',b=>output+=b);app.stderr.on('data',b=>output+=b);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error(output)),30000);const poll=()=>{if(output.includes('Ready')){clearTimeout(timer);resolve();}else if(app.exitCode!==null){clearTimeout(timer);reject(new Error(output));}else setTimeout(poll,100);};poll();});
  const auth=async(context,permitido=true)=>{
    const id=permitido?uid:'00000000-0000-4000-8000-000000000002';
    const exp=Math.floor(Date.now()/1000)+3600;
    const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const access_token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,exp,role:'authenticated',aud:'authenticated'})+'.test';
    const value='base64-'+encode({access_token,refresh_token:'test-refresh',expires_at:exp,expires_in:3600,token_type:'bearer',user:{id,email:'prueba@example.invalid'}});
    await context.addCookies([{name:'sb-127-auth-token',value,url:base}]);
  };
  return {base,estado,auth,logs:()=>output,close:async()=>{app.kill('SIGTERM');backend.closeAllConnections();await new Promise(r=>backend.close(r));}};
}
