import { test, expect } from '@playwright/test';
import { levantarApp } from './helpers/app.mjs';
let app;
test.beforeAll(async()=>{app=await levantarApp({dev:process.env.TEST_DEV==='true'});});
test.afterAll(async()=>{await app?.close();});
test.describe.configure({mode:'serial'});
const filas=page=>page.locator('main li').filter({has:page.locator('button[aria-label^="Subir "]')});
const titulos=page=>filas(page).locator('a').allTextContents();

for(const tipo of ['exposiciones','trabajos'])test(`${tipo}: flechas, persistencia, publicar/ocultar y errores`,async({page,context})=>{
 await app.auth(context);await page.goto(app.base+'/admin/'+tipo);
 const inicial=await titulos(page);expect(inicial.length).toBeGreaterThan(2);
 await filas(page).nth(0).getByRole('button',{name:/Bajar /}).click();
 await expect(page.getByRole('status')).toContainText('Orden guardado');
 expect(await titulos(page)).toEqual([inicial[1],inicial[0],...inicial.slice(2)]);
 await page.reload();expect(await titulos(page)).toEqual([inicial[1],inicial[0],...inicial.slice(2)]);
 await filas(page).nth(0).getByRole('button',{name:'● Publicada',exact:true}).click();
 await expect(filas(page).nth(0).getByRole('button',{name:'○ Oculta',exact:true})).toBeVisible();
 await filas(page).nth(0).getByRole('button',{name:'○ Oculta',exact:true}).click();
 await expect(filas(page).nth(0).getByRole('button',{name:'● Publicada',exact:true})).toBeVisible();
 app.estado.falloOrden=true;const antes=await titulos(page);
 await filas(page).nth(0).getByRole('button',{name:/Bajar /}).click();
 await expect(page.getByRole('status')).toContainText('No se guardó');expect(await titulos(page)).toEqual(antes);
 app.estado.falloOrden=false;app.estado.sinMigracion=true;
 await filas(page).nth(0).getByRole('button',{name:/Bajar /}).click();
 await expect(page.getByRole('status')).toContainText('0007_grilla_orden.sql');expect(await titulos(page)).toEqual(antes);
 app.estado.sinMigracion=false;
 app.estado.falloPublicar=true;
 await filas(page).nth(0).getByRole('button',{name:'● Publicada',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('No se pudo cambiar');
 await expect(filas(page).nth(0).getByRole('button',{name:'● Publicada',exact:true})).toBeVisible();
 app.estado.falloPublicar=false;
});

test('arrastre real con ratón y pantalla táctil, cancelación y bloqueo al guardar',async({browser})=>{
 for(const touch of [false,true]){
  const context=await browser.newContext({viewport:{width:touch?390:1280,height:900},hasTouch:touch,isMobile:touch});
  await app.auth(context);const page=await context.newPage();await page.goto(app.base+'/admin/exposiciones');
  const antes=await titulos(page);const source=await filas(page).nth(0).getByRole('button',{name:/Arrastrar /}).boundingBox();
  const target=await filas(page).nth(2).boundingBox();
  const x=source.x+source.width/2,y=source.y+source.height/2,tx=target.x+target.width/2,ty=target.y+target.height/2;
  app.estado.demoraOrden=500;
  if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
  else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(tx,ty,{steps:10});await page.mouse.up();}
  await expect(filas(page).nth(0).getByRole('button',{name:'Eliminar',exact:true})).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('Orden guardado');
  expect(await titulos(page)).toEqual([antes[1],antes[2],antes[0],...antes.slice(3)]);
  await page.reload();expect(await titulos(page)).toEqual([antes[1],antes[2],antes[0],...antes.slice(3)]);
  app.estado.demoraOrden=0;
  const estables=await titulos(page);
  const handle=await filas(page).nth(0).getByRole('button',{name:/Arrastrar /}).boundingBox();
  const hx=handle.x+handle.width/2,hy=handle.y+handle.height/2;
  if(touch){const cdp=await context.newCDPSession(page);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:hx,y:hy}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:hx,y:hy+20}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
  else{await page.mouse.move(hx,hy);await page.mouse.down();await page.mouse.move(1,1,{steps:5});await page.mouse.up();}
  expect(await titulos(page)).toEqual(estables);
  await context.close();
 }
});

test('contacto y consentimiento: sin medición antes de aceptar, registro voluntario y baja',async({page})=>{
 app.estado.eventos.clear();app.estado.leads.clear();
 await page.goto(app.base+'/contacto');
 await expect(page.getByRole('button',{name:'Continuar en WhatsApp',exact:true})).toBeVisible();
 expect(app.estado.eventos.size).toBe(0);
 await page.getByRole('button',{name:'Rechazar',exact:true}).click();
 await expect(page.getByRole('region',{name:'Preferencias de privacidad'})).toHaveCount(0);
 expect(app.estado.eventos.size).toBe(0);
 await page.getByLabel(/Autorizo guardar/).check();
 await page.getByLabel('Nombre',{exact:true}).fill('Prueba Funcional');
 await page.getByLabel('Correo',{exact:true}).fill('prueba@example.invalid');
 await page.getByLabel(/También quiero recibir/).check();
 await page.getByRole('button',{name:'Guardar datos y continuar'}).click();
 await expect(page.getByRole('status')).toContainText('Tus datos se guardaron');
 expect(app.estado.leads.size).toBe(1);expect(app.estado.eventos.size).toBe(0);
 const wa=new URL(await page.getByRole('link',{name:'Abrir WhatsApp',exact:true}).getAttribute('href'));
 expect(wa.hostname).toBe('wa.me');expect(wa.searchParams.get('text')).toContain('Prueba Funcional');
 await page.getByRole('link',{name:'enlace para darte de baja'}).click();
 await page.getByRole('button',{name:'Dejar de recibir novedades'}).click();
 await expect(page.getByRole('status')).toContainText('se retiró');
 expect([...app.estado.leads.values()][0].novedades).toBe(false);
});

test('analítica: aceptar, navegar, clic de contacto y revocar',async({page})=>{
 app.estado.eventos.clear();await page.goto(app.base+'/contacto');
 await page.getByRole('button',{name:'Aceptar analítica',exact:true}).click();
 await expect.poll(()=>app.estado.eventos.size).toBe(1);
 await page.getByRole('link',{name:'Trabajos',exact:true}).first().click();
 await expect.poll(()=>[...app.estado.eventos.values()].some(e=>e.ruta==='/trabajos')).toBe(true);
 await page.locator('a[href^="mailto:"]:visible').first().click();
 await expect.poll(()=>[...app.estado.eventos.values()].some(e=>e.evento==='email')).toBe(true);
 await page.getByRole('button',{name:'Preferencias de privacidad',exact:true}).click();
 await page.getByRole('button',{name:'Rechazar',exact:true}).click();
 const n=app.estado.eventos.size;await page.goto(app.base+'/contacto');
 expect(app.estado.eventos.size).toBe(n);
});

test('dashboard y exportación: visitante, cuenta no habilitada y administrador',async({browser})=>{
 const anon=await browser.newContext();let page=await anon.newPage();
 await page.goto(app.base+'/admin/contactos');await expect(page).toHaveURL(/\/admin\/login/);await anon.close();
 const sinPermiso=await browser.newContext();await app.auth(sinPermiso,false);page=await sinPermiso.newPage();
 await page.goto(app.base+'/admin/estadisticas');await expect(page.getByText(/requiere habilitación/)).toBeVisible();
 expect((await page.request.get(app.base+'/admin/contactos-exportar')).status()).toBe(403);await sinPermiso.close();
 const admin=await browser.newContext();await app.auth(admin);page=await admin.newPage();
 await page.goto(app.base+'/admin/estadisticas');await expect(page.getByText('Visitas medidas',{exact:true})).toBeVisible();
 await page.goto(app.base+'/admin/contactos');await expect(page.getByText('Prueba Funcional',{exact:true})).toBeVisible();
 const csv=await page.request.get(app.base+'/admin/contactos-exportar');expect(csv.status()).toBe(200);expect(await csv.text()).toContain('prueba@example.invalid');
 await admin.close();
});

test('grilla 3/2/1 y orden público consistente con admin',async({page})=>{
 for(const [width,columnas] of [[1280,3],[800,2],[390,1]]){
  await page.setViewportSize({width,height:1000});await page.goto(app.base+'/exposiciones');
  const cards=page.locator('figure').filter({has:page.locator('a[href^="/exposiciones/expo-"]')});
  await expect(cards).toHaveCount(6);
  const boxes=await cards.evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();const foto=n.querySelector('[data-foto],[role="img"]');const f=foto.getBoundingClientRect();return{x:r.x,y:r.y,w:f.width,h:f.height,href:n.querySelector('a').getAttribute('href')};}));
  for(const b of boxes)expect(Math.abs(b.w-b.h)).toBeLessThan(2);
  expect(boxes.filter(b=>Math.abs(b.y-boxes[0].y)<2)).toHaveLength(columnas);
  expect(boxes.map(b=>b.href)).toEqual(app.estado.grupos.filter(g=>g.tipo==='exposicion').sort((a,b)=>a.orden-b.orden).map(g=>'/exposiciones/'+g.slug));
 }
});

test('encuadre persistente y edición compatible con base sin actualizar',async({page,context})=>{
 const grupo=app.estado.grupos.find(g=>g.tipo==='exposicion');
 const original={...grupo};
 grupo.fotos=[{id:'50000000-0000-4000-8000-000000000001',exposicion_id:grupo.id,imagen_path:'/firma-jessica.png',imagen_alt:'Foto de prueba',imagen_ancho:600,imagen_alto:300,orden:1}];
 await app.auth(context);await page.goto(app.base+'/admin/exposiciones/'+grupo.id);
 await page.getByLabel('Horizontal').press('Home');await page.getByLabel('Horizontal').press('ArrowRight');
 await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Cambios guardados');expect(grupo.portada_foco_x).toBe(1);
 await page.reload();await expect(page.getByLabel('Horizontal')).toHaveValue('1');
 app.estado.sinMigracion=true;await page.reload();
 await expect(page.getByLabel('Horizontal')).toHaveCount(0);
 await expect(page.getByText(/El encuadre requiere aplicar/)).toBeVisible();
 await page.getByLabel('Título').fill('Título corregido');
 await page.getByRole('button',{name:'Guardar cambios',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('Cambios guardados');expect(grupo.titulo).toBe('Título corregido');
 app.estado.sinMigracion=false;Object.assign(grupo,original);
});

test('WhatsApp sin registro abre el mensaje elegido sin guardar datos',async({page})=>{
 const antes=app.estado.leads.size;
 await page.route('https://wa.me/**',route=>route.fulfill({contentType:'text/plain',body:'WhatsApp simulado: no se envían mensajes.'}));
 await page.goto(app.base+'/contacto');
 await page.getByRole('button',{name:'Rechazar',exact:true}).click();
 await page.getByRole('combobox').selectOption('obra');
 await page.getByLabel('Nombre (opcional)',{exact:true}).fill('María de prueba');
 await page.getByLabel('Comentario (opcional)',{exact:true}).fill('¿Está disponible?');
 await page.getByRole('button',{name:'Continuar en WhatsApp',exact:true}).click();
 await expect(page).toHaveURL(/^https:\/\/wa\.me\//);
 const texto=new URL(page.url()).searchParams.get('text');
 expect(texto).toContain('María de prueba');expect(texto).toContain('¿Está disponible?');
 expect(texto).toContain('obra');expect(app.estado.leads.size).toBe(antes);
});
